# Metrics

The codebase supports collecting the following operational metrics:

- `assignment_create_to_complete_ms`
- `generation_job_duration_ms`
- `pdf_generation_duration_ms`
- `generation_failure_rate`
- `schema_validation_failure_rate`
- `socket_delivery_latency_ms`
- `queue_wait_time_ms`
- `pdf_cache_hit_rate`

Recommended storage targets:

- logs (structured JSON via `pino`)
- Redis counters for quick aggregation
- external observability backend for long-term dashboards
