// Single source of truth for per-route SEO metadata.
// Imported by the client (runtime title updates), the SSR entry, and the
// prerender script (static <head> injection) so all three stay in sync.

export const ORIGIN = 'https://livergate-osaka.com';

export interface RouteMeta {
  path: string;
  title: string;
  description: string;
  ogTitle: string;
  ogDescription: string;
}

export const ROUTES: RouteMeta[] = [
  {
    path: '/',
    title:
      'カイギョーズ（Kaygyoz）｜大阪の飲食店開業支援・固定費削減｜株式会社LiverGate',
    description:
      '大阪を拠点に飲食店の開業・運営を支援する専門コンシェルジュサービス「カイギョーズ（Kaygyoz）」。カイギョウ・カイギョー・kaigyoとも表記。株式会社LiverGate（ライバーゲート）が、インフラ・固定費の最適化を中立的な立場でサポートします。',
    ogTitle:
      'カイギョーズ（Kaygyoz）｜大阪の飲食店開業支援｜株式会社LiverGate',
    ogDescription:
      '大阪の飲食店開業支援サービス「カイギョーズ（Kaygyoz）」。株式会社LiverGate（ライバーゲート）が、開業・インフラ・固定費の最適化を中立的な立場でサポート。',
  },
  {
    path: '/services',
    title:
      'サービス一覧｜飲食店のインフラ・固定費を最適化｜カイギョーズ（Kaygyoz）',
    description:
      'カイギョーズ（Kaygyoz）が提供する飲食店向けサービス一覧。キャッシュレス決済・光回線・電力・POSレジなど、開業と運営に必要なインフラ・固定費を、大阪の飲食店オーナー様に中立的な立場で最適化提案します。',
    ogTitle: 'サービス一覧｜飲食店のインフラ・固定費を最適化｜カイギョーズ（Kaygyoz）',
    ogDescription:
      'キャッシュレス決済・光回線・電力・POSレジなど、飲食店のインフラと固定費をまとめて最適化。大阪のカイギョーズ（Kaygyoz）が中立的にサポート。',
  },
  {
    path: '/cases',
    title: '導入事例｜飲食店オーナーの成功事例｜カイギョーズ（Kaygyoz）',
    description:
      'カイギョーズ（Kaygyoz）の導入事例。大阪を中心に、飲食店の開業・固定費削減・インフラ最適化を支援した実例をご紹介します。株式会社LiverGate運営。',
    ogTitle: '導入事例｜飲食店オーナーの成功事例｜カイギョーズ（Kaygyoz）',
    ogDescription:
      '大阪を中心とした飲食店の開業・固定費削減・インフラ最適化の実例。カイギョーズ（Kaygyoz）の導入事例をご紹介します。',
  },
  {
    path: '/contact',
    title: 'お問い合わせ｜LINEで無料相談｜カイギョーズ（Kaygyoz）',
    description:
      '飲食店の開業・固定費・インフラのご相談はカイギョーズ（Kaygyoz）へ。大阪の飲食店オーナー様向けにLINEで無料相談を受け付けています。株式会社LiverGate運営。',
    ogTitle: 'お問い合わせ｜LINEで無料相談｜カイギョーズ（Kaygyoz）',
    ogDescription:
      '飲食店の開業・固定費・インフラのご相談はカイギョーズ（Kaygyoz）へ。大阪のオーナー様向けにLINEで無料相談を受付中。',
  },
];

export const META: Record<string, RouteMeta> = Object.fromEntries(
  ROUTES.map((r) => [r.path, r])
);
