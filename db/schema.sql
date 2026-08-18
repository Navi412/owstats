-- owstats database schema (Neon / Postgres)
-- Run this once against your Neon database before the first poll.

CREATE TABLE IF NOT EXISTS players (
  slug         text PRIMARY KEY,        -- 'player_1' | 'player_2'
  battletag    text NOT NULL,
  display_name text NOT NULL,
  updated_at   timestamptz NOT NULL DEFAULT now(),
  -- Snapshot up to which this player's games have already been counted into
  -- a match (or a season-reset baseline). Matching compares each player's
  -- latest snapshot against this pointer instead of requiring both players'
  -- deltas to land in the same poll, since polls rarely land in sync.
  counted_through_snapshot_id bigint
);

CREATE TABLE IF NOT EXISTS snapshots (
  id           bigserial PRIMARY KEY,
  player_slug  text NOT NULL REFERENCES players(slug),
  games_played integer NOT NULL,
  games_won    integer NOT NULL,
  payload      jsonb NOT NULL,          -- raw "general" stats block from OverFast, for audit
  taken_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS snapshots_player_taken_at_idx
  ON snapshots (player_slug, taken_at DESC);

ALTER TABLE players
  ADD CONSTRAINT players_counted_through_snapshot_fk
  FOREIGN KEY (counted_through_snapshot_id) REFERENCES snapshots(id);

-- A "match" row is not a single game: OverFast has no per-match history.
-- It represents one poll window in which BOTH players' games_played
-- increased, i.e. strong evidence they queued together in that window.
CREATE TABLE IF NOT EXISTS matches (
  id                    bigserial PRIMARY KEY,
  window_start          timestamptz NOT NULL,
  window_end            timestamptz NOT NULL,
  games_delta           integer NOT NULL CHECK (games_delta > 0),
  wins_delta            integer NOT NULL CHECK (wins_delta >= 0 AND wins_delta <= games_delta),
  losses_delta          integer NOT NULL CHECK (losses_delta >= 0 AND losses_delta <= games_delta),
  player_1_snapshot_id  bigint NOT NULL REFERENCES snapshots(id),
  player_2_snapshot_id  bigint NOT NULL REFERENCES snapshots(id),
  created_at            timestamptz NOT NULL DEFAULT now(),
  CHECK (wins_delta + losses_delta = games_delta)
);

CREATE INDEX IF NOT EXISTS matches_window_end_idx
  ON matches (window_end DESC);

-- One row per /api/poll invocation, used to show "last successful sync".
CREATE TABLE IF NOT EXISTS sync_log (
  id               bigserial PRIMARY KEY,
  run_at           timestamptz NOT NULL DEFAULT now(),
  success          boolean NOT NULL,     -- true only if both players yielded usable stats
  player_1_status  text NOT NULL,        -- 'ok' | 'season_reset' | 'private' | 'not_found' | 'error'
  player_2_status  text NOT NULL,
  message          text
);

CREATE INDEX IF NOT EXISTS sync_log_run_at_idx
  ON sync_log (run_at DESC);

CREATE INDEX IF NOT EXISTS sync_log_success_run_at_idx
  ON sync_log (run_at DESC) WHERE success;
