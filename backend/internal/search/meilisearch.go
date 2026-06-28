package search

import (
	"encoding/json"
	"fmt"

	meilisearch "github.com/meilisearch/meilisearch-go"
)

type Client struct {
	ms    meilisearch.ServiceManager
	index string
}

type ModelDocument struct {
	ID                 string   `json:"id"`
	Slug               string   `json:"slug"`
	Name               string   `json:"name"`
	Description        string   `json:"description"`
	Architecture       string   `json:"architecture"`
	Framework          string   `json:"framework"`
	License            string   `json:"license"`
	Language           string   `json:"language"`
	Tags               []string `json:"tags"`
	VerificationStatus string   `json:"verification_status"`
	DownloadCount      int64    `json:"download_count"`
	ParameterCount     int64    `json:"parameter_count"`
	Quantization       string   `json:"quantization"`
	TotalSize          int64    `json:"total_size"`
}

type SearchResult struct {
	Hits      []ModelDocument `json:"hits"`
	TotalHits int64           `json:"total_hits"`
	Query     string          `json:"query"`
	Offset    int64           `json:"offset"`
	Limit     int64           `json:"limit"`
}

func NewClient(url, apiKey string) *Client {
	ms := meilisearch.New(url, meilisearch.WithAPIKey(apiKey))
	return &Client{ms: ms, index: "models"}
}

func (c *Client) EnsureIndexes() error {
	task, err := c.ms.CreateIndex(&meilisearch.IndexConfig{
		Uid:        c.index,
		PrimaryKey: "id",
	})
	if err != nil {
		// Index may already exist
		return nil
	}
	_ = task

	idx := c.ms.Index(c.index)

	filterableAttrs := []interface{}{
		"architecture", "framework", "license", "language",
		"verification_status", "tags", "total_size", "parameter_count",
	}
	_, err = idx.UpdateFilterableAttributes(&filterableAttrs)
	if err != nil {
		return fmt.Errorf("update filterable attrs: %w", err)
	}

	sortableAttrs := []string{"download_count", "parameter_count", "total_size"}
	_, err = idx.UpdateSortableAttributes(&sortableAttrs)
	if err != nil {
		return fmt.Errorf("update sortable attrs: %w", err)
	}

	searchableAttrs := []string{
		"name", "description", "architecture", "tags", "license", "framework",
	}
	_, err = idx.UpdateSearchableAttributes(&searchableAttrs)
	return err
}

func (c *Client) IndexModel(doc ModelDocument) error {
	_, err := c.ms.Index(c.index).AddDocuments([]ModelDocument{doc}, nil)
	return err
}

func (c *Client) DeleteModel(id string) error {
	_, err := c.ms.Index(c.index).DeleteDocument(id, nil)
	return err
}

func (c *Client) Search(query string, page, limit int, filters string) (*SearchResult, error) {
	offset := int64((page - 1) * limit)
	req := &meilisearch.SearchRequest{
		Offset: offset,
		Limit:  int64(limit),
	}
	if filters != "" {
		req.Filter = filters
	}

	resp, err := c.ms.Index(c.index).Search(query, req)
	if err != nil {
		return nil, err
	}

	totalHits := resp.EstimatedTotalHits

	result := &SearchResult{
		Query:     query,
		TotalHits: totalHits,
		Offset:    offset,
		Limit:     int64(limit),
	}
	for _, hit := range resp.Hits {
		raw, err := json.Marshal(hit)
		if err != nil {
			continue
		}
		var doc ModelDocument
		if err := json.Unmarshal(raw, &doc); err == nil {
			result.Hits = append(result.Hits, doc)
		}
	}
	return result, nil
}
