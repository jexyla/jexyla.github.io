// Six case studies with their brand themes. Images are local copies of Jessica's own images from
// jexyla.com (that site sends no CORS headers, so remote images can't be WebGL textures).
// Projects with fewer than three images are padded with brand cover art in the gallery.
const IMG = 'assets/images/';
// `title` is shown big on the project screen; \n marks a preferred line break.

export const projects = [
  {
    // Copy from Jessica's CV.
    id: 'deel', brand: 'deel', color: '#7451c8', company: 'Deel', title: 'Engage Canvas: Rethinking Course Authoring',
    fullTitle: 'Engage Canvas: Rethinking Course Authoring',
    summary: 'Engage Canvas is an AI-co-created generative authoring engine that changes how admins build, edit and maintain learning courses at Deel. It moves course authoring away from a rigid, block-based, Notion-style editor and into a fluid canvas, where admins shape custom web experiences alongside AI.',
    url: 'deel-engage-canvas-case-study',
    locked: true,   // password protected: "Open case study" asks for the password first (see PUBLISHING.md)
    theme: { bg: '#f6f0fd', ink: '#1b1b1f', accent: '#7451c8' },
    images: [IMG + 'deel-1.jpg'],
  },
  {
    id: 'cleo', brand: 'cleo', color: '#3b22ff', company: 'Cleo', title: 'Behind the scenes of AI-generated Chats: Prompt Engineering',
    fullTitle: 'Behind the scenes of AI-generated Chats: Prompt Engineering',
    summary: 'Chatbots have come a long way. They’re no longer just scripted responses. Today, they can hold intelligent conversations thanks to LLMs.',
    url: 'cleo-ai-prompt-engineering-case-study',
    theme: { bg: '#2414b8', ink: '#ffffff', accent: '#3ef2a0' },
    images: [IMG + 'cleo-cover.png', IMG + 'cleo-2.png', IMG + 'cleo-3.png', IMG + 'cleo-4.png'],
  },
  {
    id: 'ai-chats', brand: 'cleo-chat', color: '#6b4bff', company: 'Cleo', title: 'Designing for\nAI-generated Chats',
    fullTitle: 'Designing for AI-generated Chats',
    summary: 'As AI-generated chats become more popular, people expect conversations to be both dynamic and engaging.',
    url: 'cleo-ai-chat-case-study',
    theme: { bg: '#efeaff', ink: '#1b1b1f', accent: '#6b4bff' },
    images: [IMG + 'ai-chats-cover.png'],
    imageFit: 'height',   // phones are cropped at the image's top and bottom: run them edge to edge
  },
  {
    id: 'moneybox', brand: 'moneybox', color: '#7fe0dc', company: 'Moneybox', title: 'Building Moneybox Mortgage Advice',
    fullTitle: 'Building Moneybox Mortgage Advice',
    summary: 'A full in-app service to help find a mortgage that’s right for you.',
    url: 'moneybox-mortgages-case-study',
    theme: { bg: '#d9f6f4', ink: '#01292b', accent: '#1f8a84' },
    images: [IMG + 'moneybox-1.png'],
  },
  {
    id: 'monese', brand: 'monese', color: '#1d5fd6', company: 'Monese', title: 'Helping the\n‘credit invisible’ customers',
    fullTitle: 'Helping the ‘credit invisible’ customers',
    summary: 'A set of credit tools for Monese customers who are either credit invisible or have a poor credit score.',
    url: 'monese-credit-case-study',
    theme: { bg: '#f3f2ee', ink: '#1b1b1f', accent: '#1d5fd6' },
    images: [IMG + 'monese-1.png'],
  },
  {
    id: 'monzo', brand: 'monzo', color: '#ff4f40', company: 'Monzo', title: 'Ethical design:\nGambling block',
    fullTitle: 'Ethical design: Gambling block',
    summary: 'In 2018 we researched, developed and launched a feature that allows our customers to block gambling transactions.',
    url: 'monzo-gambling-block-case-study',
    theme: { bg: '#ff4f40', ink: '#ffffff', accent: '#14233c' },
    images: [IMG + 'monzo-cover.png'],
  },
];
