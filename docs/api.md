# API & Event Flow

## API Surface

Base path: `/api`

- `POST /assignments`
- `GET /assignments` (paginated: `?page=N&pageSize=N`, default 1/20, capped 50)
- `GET /assignments/:id`
- `DELETE /assignments/:id`
- `POST /assignments/:id/regenerate`
- `GET /assignments/:id/pdf`
- `GET /health`

## Event and Queue Flow

### Generation flow

```text
POST /assignments
 -> validate payload
 -> save assignment(status=pending)
 -> enqueue generation job
 -> worker processes job
 -> progress events published
 -> paper saved(status=completed)
 -> job:complete emitted
```

### Progress event stages

- `analyzing`
- `building_prompt`
- `generating`
- `refining` (when retry path is used)
- `parsing`
- `sectioning`
- `saving`
- `complete`
