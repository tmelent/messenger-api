export default () => ({
    port: parseInt(process.env.PORT || '4000', 10),
    database: {
        host: process.env.DATABASE_HOST || 'localhost',
        port: parseInt(process.env.DATABASE_PORT || '5432', 10),
        username: process.env.DATABASE_USER,
        password: process.env.DATABASE_PASSWORD,
        name: process.env.DATABASE_NAME,
    },
    encryption: {
        key: process.env.ENCRYPTION_KEY,
        iv: process.env.ENCRYPTION_IV,
    },
    jwtSecret: process.env.JWT_SECRET || 'JAsd873q125jadsgfjklDJGSDKJE',
})