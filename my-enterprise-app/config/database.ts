export default {
  connection: {
    client: process.env.DB_CLIENT || "postgres",
    connection: {
      host: process.env.DB_HOST || "localhost",
      port: parseInt(process.env.DB_PORT || "5432", 10),
      database: process.env.DB_NAME || "enterprise",
      user: process.env.DB_USER || "postgres",
      password: process.env.DB_PASSWORD || "postgres",
    },
    pool: { min: 2, max: 10 },
  },
};
