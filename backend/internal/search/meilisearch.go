package search

import (
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
	Hits       []ModelDocument `json:"hits"`
	TotalHits  int64           `json:"total_hits"`
	Query      string          `json:"query"`
	Offset     int64           `json:"offset"`
	Limit      int64           `json:"limit"`
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

	_, err = idx.UpdateFilterableAttributes(&[]string{
		"architecture", "framework", "license", "language",
		"verification_status", "tags", "total_size", "parameter_count",
	})
	if err != nil {
		return fmt.Errorf("update filterable attrs: %w", err)
	}

	_, err = idx.UpdateSortableAttributes(&[]string{
		"download_count", "parameter_count", "total_size",
	})
	if err != nil {
		return fmt.Errorf("update sortable attrs: %w", err)
	}

	_, err = idx.UpdateSearchableAttributes(&[]string{
		"name", "description", "architecture", "tags", "license", "framework",
	})
	return err
}

func (c *Client) IndexModel(doc ModelDocument) error {
	_, err := c.ms.Index(c.index).AddDocuments([]ModelDocument{doc})
	return err
}

func (c *Client) DeleteModel(id string) error {
	_, err := c.ms.Index(c.index).DeleteDocument(id)
	return err
}

func (c *Client) Search(query string, page, limit int, filters string) (*SearchResult, error) {
	offset := int64((page - 1) * limit)
	req := &meilisearch.SearchRequest{
		Query:  query,
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

	totalHits := resp.TotalHits
	if totalHits == 0 {
		totalHits = resp.EstimatedTotalHits
	}

	result := &SearchResult{
		Query:     query,
		TotalHits: totalHits,
		Offset:    offset,
		Limit:     int64(limit),
	}
	for _, hit := range resp.Hits {
		if m, ok := hit.(map[string]interface{}); ok {
			doc := hitToDocument(m)
			result.Hits = append(result.Hits, doc)
		}
	}
	return result, nil
}

func hitToDocument(m map[string]interface{}) ModelDocument {
	doc := ModelDocument{}
	if v, ok := m["id"].(string); ok {
		doc.ID = v
	}
	if v, ok := m["slug"].(string); ok {
		doc.Slug = v
	}
	if v, ok := m["name"].(string); ok {
		doc.Name = v
	}
	if v, ok := m["description"].(string); ok {
		doc.Description = v
	}
	if v, ok := m["architecture"].(string); ok {
		doc.Architecture = v
	}
	if v, ok := m["framework"].(string); ok {
		doc.Framework = v
	}
	if v, ok := m["license"].(string); ok {
		doc.License = v
	}
	if v, ok := m["verification_status"].(string); ok {
		doc.VerificationStatus = v
	}
	if v, ok := m["download_count"].(float64); ok {
		doc.DownloadCount = int64(v)
	}
	if v, ok := m["tags"].([]interface{}); ok {
		for _, t := range v {
			if s, ok := t.(string); ok {
				doc.Tags = append(doc.Tags, s)
			}
		}
	}
	return doc
}
