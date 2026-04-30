import cluster from 'cluster';

// DB_POOL_MAX * CLUSTER_WORKERS must stay below PostgreSQL max_connections (default 100).
// In production set CLUSTER_WORKERS to the number of CPU cores (e.g. $(nproc)).
const WORKERS = parseInt(process.env.CLUSTER_WORKERS ?? '1', 10);

export function runWithCluster(bootstrap: () => Promise<void>): void {
  if (WORKERS > 1 && cluster.isPrimary) {
    console.log(`Primary ${process.pid}: forking ${WORKERS} workers`);
    for (let i = 0; i < WORKERS; i++) {
      cluster.fork();
    }
    cluster.on('exit', (worker, code) => {
      console.warn(`Worker ${worker.process.pid} exited (code ${code}), restarting`);
      cluster.fork();
    });
  } else {
    bootstrap().then(() => {
      const label = WORKERS > 1 ? `Worker ${process.pid}` : 'Server';
      console.log(`${label}: HTTP  → http://localhost:${process.env.PORT ?? 3000}`);
      console.log(`${label}: WS    → ws://localhost:${process.env.WS_PORT ?? 3001}/ws/proxy`);
    });
  }
}
