function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const env = {
  get databaseUrl() {
    return required("DATABASE_URL");
  },
  get cronSecret() {
    return required("CRON_SECRET");
  },
  get player1BattleTag() {
    return required("PLAYER_1");
  },
  get player2BattleTag() {
    return required("PLAYER_2");
  },
  get player1Label(): string {
    return process.env.PLAYER_1_LABEL || this.player1BattleTag.split("-")[0];
  },
  get player2Label(): string {
    return process.env.PLAYER_2_LABEL || this.player2BattleTag.split("-")[0];
  },
};
