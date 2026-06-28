package storage

import (
	"bytes"
	"context"
	"fmt"
	"io"
	"time"

	"github.com/minio/minio-go/v7"
	"github.com/minio/minio-go/v7/pkg/credentials"

	"huggingbay/internal/config"
)

type Client struct {
	mc     *minio.Client
	bucket string
}

func NewMinIO(cfg *config.Config) (*Client, error) {
	mc, err := minio.New(cfg.MinioEndpoint, &minio.Options{
		Creds:  credentials.NewStaticV4(cfg.MinioAccessKey, cfg.MinioSecretKey, ""),
		Secure: cfg.MinioUseSSL,
	})
	if err != nil {
		return nil, fmt.Errorf("minio: %w", err)
	}

	ctx := context.Background()
	exists, err := mc.BucketExists(ctx, cfg.MinioBucket)
	if err != nil {
		return nil, fmt.Errorf("minio bucket check: %w", err)
	}
	if !exists {
		if err := mc.MakeBucket(ctx, cfg.MinioBucket, minio.MakeBucketOptions{}); err != nil {
			return nil, fmt.Errorf("minio make bucket: %w", err)
		}
		// Set public read policy for torrent files
		policy := fmt.Sprintf(`{
			"Version":"2012-10-17",
			"Statement":[{
				"Effect":"Allow",
				"Principal":{"AWS":["*"]},
				"Action":["s3:GetObject"],
				"Resource":["arn:aws:s3:::%s/torrents/*"]
			}]
		}`, cfg.MinioBucket)
		if err := mc.SetBucketPolicy(ctx, cfg.MinioBucket, policy); err != nil {
			// Non-fatal — torrent files can still be served via presigned URLs
			fmt.Printf("warning: could not set bucket policy: %v\n", err)
		}
	}

	return &Client{mc: mc, bucket: cfg.MinioBucket}, nil
}

func (c *Client) UploadTorrent(ctx context.Context, objectName string, data []byte) (string, error) {
	_, err := c.mc.PutObject(ctx, c.bucket, "torrents/"+objectName, bytes.NewReader(data), int64(len(data)), minio.PutObjectOptions{
		ContentType: "application/x-bittorrent",
	})
	if err != nil {
		return "", fmt.Errorf("upload torrent: %w", err)
	}
	return "torrents/" + objectName, nil
}

func (c *Client) GetTorrent(ctx context.Context, objectName string) (io.ReadCloser, int64, error) {
	obj, err := c.mc.GetObject(ctx, c.bucket, objectName, minio.GetObjectOptions{})
	if err != nil {
		return nil, 0, err
	}
	info, err := obj.Stat()
	if err != nil {
		obj.Close()
		return nil, 0, err
	}
	return obj, info.Size, nil
}

func (c *Client) PresignedURL(ctx context.Context, objectName string) (string, error) {
	u, err := c.mc.PresignedGetObject(ctx, c.bucket, objectName, 24*time.Hour, nil)
	if err != nil {
		return "", err
	}
	return u.String(), nil
}
