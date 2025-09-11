import Head from 'next/head'
import Link from 'next/link'
import styles from '../styles/Home.module.css'

export default function Home() {
  return (
    <div className={styles.container}>
      <Head>
        <title>Next.js Full-Stack | React Next Java Journey</title>
        <meta name="description" content="Phase 2: Next.js full-stack development" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <div className={styles.badge}>Phase 2</div>
        <h1 className={styles.title}>
          Welcome to <span className={styles.highlight}>Next.js!</span>
        </h1>

        <p className={styles.description}>
          Learn full-stack development with React's production framework
        </p>

        <div className={styles.grid}>
          <div className={styles.card}>
            <h2>Server-Side Rendering &rarr;</h2>
            <p>Learn how to render React components on the server for better SEO and performance.</p>
          </div>

          <div className={styles.card}>
            <h2>API Routes &rarr;</h2>
            <p>Build backend functionality directly in your Next.js application with API routes.</p>
          </div>

          <div className={styles.card}>
            <h2>Static Generation &rarr;</h2>
            <p>Pre-generate pages at build time for optimal performance and SEO.</p>
          </div>

          <div className={styles.card}>
            <h2>TypeScript Support &rarr;</h2>
            <p>Add type safety to your applications with built-in TypeScript support.</p>
          </div>
        </div>

        <div className={styles.cta}>
          <Link href="/blog" className={styles.button}>
            Explore Blog Example
          </Link>
        </div>
      </main>

      <footer className={styles.footer}>
        <p>React → Next.js → Java Journey</p>
      </footer>
    </div>
  )
}