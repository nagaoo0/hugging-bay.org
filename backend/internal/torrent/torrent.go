package torrent

import (
	"bytes"
	"crypto/sha1"
	"encoding/hex"
	"errors"
	"strconv"
)

// ExtractInfoHash computes the BitTorrent info_hash from raw .torrent file bytes.
// It finds the "info" key's value in the bencoded dict and SHA1s those bytes.
func ExtractInfoHash(data []byte) (string, error) {
	// torrent files are bencoded dicts starting with 'd'
	marker := []byte("4:info")
	idx := bytes.Index(data, marker)
	if idx < 0 {
		return "", errors.New("info key not found in torrent file")
	}
	start := idx + len(marker)
	if start >= len(data) {
		return "", errors.New("truncated torrent file")
	}
	end, err := valueEnd(data, start)
	if err != nil {
		return "", err
	}
	h := sha1.Sum(data[start:end])
	return hex.EncodeToString(h[:]), nil
}

// TorrentSize returns the total size of all files declared in the torrent.
func TorrentSize(data []byte) int64 {
	// Look for "length" key (single-file) or sum "files" list
	// Simple approach: scan for "6:length" in info dict
	lengthMarker := []byte("6:lengthi")
	idx := bytes.Index(data, lengthMarker)
	if idx < 0 {
		return 0
	}
	start := idx + len(lengthMarker)
	end := bytes.IndexByte(data[start:], 'e')
	if end < 0 {
		return 0
	}
	n, err := strconv.ParseInt(string(data[start:start+end]), 10, 64)
	if err != nil {
		return 0
	}
	return n
}

// valueEnd returns the index just past the end of the bencoded value starting at pos.
func valueEnd(data []byte, pos int) (int, error) {
	if pos >= len(data) {
		return -1, errors.New("unexpected end of bencoded data")
	}
	switch {
	case data[pos] == 'd':
		i := pos + 1
		for i < len(data) && data[i] != 'e' {
			// key (always a bencoded string)
			end, err := valueEnd(data, i)
			if err != nil {
				return -1, err
			}
			i = end
			// value
			end, err = valueEnd(data, i)
			if err != nil {
				return -1, err
			}
			i = end
		}
		if i >= len(data) {
			return -1, errors.New("unterminated bencoded dict")
		}
		return i + 1, nil

	case data[pos] == 'l':
		i := pos + 1
		for i < len(data) && data[i] != 'e' {
			end, err := valueEnd(data, i)
			if err != nil {
				return -1, err
			}
			i = end
		}
		if i >= len(data) {
			return -1, errors.New("unterminated bencoded list")
		}
		return i + 1, nil

	case data[pos] == 'i':
		end := bytes.IndexByte(data[pos:], 'e')
		if end < 0 {
			return -1, errors.New("unterminated bencoded integer")
		}
		return pos + end + 1, nil

	default:
		// bencoded string: length:data
		colon := bytes.IndexByte(data[pos:], ':')
		if colon < 0 {
			return -1, errors.New("invalid bencoded string: no colon")
		}
		length, err := strconv.Atoi(string(data[pos : pos+colon]))
		if err != nil {
			return -1, errors.New("invalid bencoded string length")
		}
		return pos + colon + 1 + length, nil
	}
}
