process.on('unhandledRejection', (reason, promise) => {
    const r = reason && typeof reason === 'object' ? { ...reason } : { reason };
    console.error(reason === promise ? promise : { ...r, ...promise });
    process.exit(1);
});