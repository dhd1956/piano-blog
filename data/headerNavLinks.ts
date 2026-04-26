// Navigation structure with grouped items
export interface NavItem {
  href: string
  title: string
}

export interface NavGroup {
  type: 'link' | 'dropdown'
  title: string
  href?: string
  items?: NavItem[]
}

const headerNavLinks: NavGroup[] = [
  { type: 'link', title: 'Home', href: '/' },
  {
    type: 'dropdown',
    title: 'Blog',
    items: [
      { href: '/blog', title: 'All Posts' },
      { href: '/tags', title: 'Tags' },
    ],
  },
  {
    type: 'dropdown',
    title: 'Community',
    items: [
      { href: '/venues', title: 'Venues' },
      { href: '/musicians', title: 'Musicians' },
      { href: '/events', title: 'Events' },
      { href: '/leaderboard', title: 'Leaderboard' },
      { href: '/referrals', title: 'Referrals' },
      { href: '/submit', title: 'Submit Venue' },
      { href: '/community/dashboard', title: 'Dashboard' },
    ],
  },
  {
    type: 'dropdown',
    title: 'Admin',
    items: [
      { href: '/admin/users', title: 'Members' },
      { href: '/admin/events', title: 'Events' },
      { href: '/admin/pxp-config', title: 'PXP Config' },
      { href: '/curator', title: 'Curator' },
    ],
  },
  { type: 'link', title: 'About', href: '/about' },
]

// Legacy flat structure for backward compatibility
export const legacyHeaderNavLinks = [
  { href: '/', title: 'Home' },
  { href: '/blog', title: 'Blog' },
  { href: '/tags', title: 'Tags' },
  { href: '/profile', title: 'My Profile' },
  { href: '/musicians', title: 'Musicians' },
  { href: '/events', title: 'Events' },
  { href: '/venues', title: 'Venues' },
  { href: '/submit', title: 'Submit' },
  { href: '/community/dashboard', title: 'Dashboard' },
  { href: '/curator', title: 'Curator' },
  { href: '/about', title: 'About' },
]

export default headerNavLinks
