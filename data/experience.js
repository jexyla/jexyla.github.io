// Jessica's experience, newest first, from her portfolio CV.
// `theme` styles the logo tile (the project themes where there is one).
import { projects } from './projects.js';

const theme = id => projects.find(p => p.id === id).theme;

export const experience = [
  {
    company: 'Deel', brand: 'deel', dates: 'January 2024 – Present', role: 'Senior Product Designer',
    place: 'London, UK (Remote) · Learning team',
    highlight: 'Led the launch of 4 AI features across course creation and editing.',
    theme: theme('deel'),
  },
  {
    company: 'Cleo AI', brand: 'cleo', dates: 'November 2021 – December 2023', role: 'Senior Product Designer',
    place: 'London, UK (Remote)',
    highlight: 'Designed internal tools for AI-generated chats, improving chat quality by 98%.',
    theme: theme('cleo'),
  },
  {
    company: 'Moneybox', brand: 'moneybox', dates: 'August 2020 – October 2021', role: 'Senior Product Designer',
    place: 'London, UK',
    highlight: 'Won What Mortgage awards 2022–2024 for Best Online Mortgage Broker.',
    theme: theme('moneybox'),
  },
  {
    company: 'Monese', brand: 'monese', dates: 'April 2019 – July 2020', role: 'Senior Product Designer',
    place: 'London, UK',
    highlight: 'Crafted a range of Credit services for credit-invisible customers.',
    theme: theme('monese'),
  },
  {
    company: 'Monzo Bank', brand: 'monzo', dates: 'March 2018 – March 2019', role: 'Product Designer',
    place: 'London, UK',
    highlight: 'Led the design of Monzo’s Gambling Block, used by 700,000+ people.',
    theme: theme('monzo'),
  },
  {
    company: 'carwow', brand: 'carwow', dates: 'August 2015 – February 2018', role: 'Product Designer',
    place: 'London, UK',
    highlight: 'Contributed to the start and evolution of the Carwow Design System.',
    theme: { bg: '#1edce8', ink: '#000000', accent: '#000000' },   // carwow cyan
  },
  {
    company: 'Gousto', brand: 'gousto', dates: 'June 2014 – August 2015', role: 'Visual Designer',
    place: 'London, UK',
    highlight: 'First designer on the team: developed the Gousto brand identity.',
    theme: { bg: '#ffeef1', ink: '#f50a3c', accent: '#f50a3c' },   // soft pink so the red logo stands out on white
  },
];
