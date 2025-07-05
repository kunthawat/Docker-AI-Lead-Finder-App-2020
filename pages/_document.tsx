import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html lang="th">
      <Head>
        <meta name="description" content="Smart Lead Finder - ระบบค้นหาข้อมูลลูกค้าอัจฉริยะด้วย AI" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}