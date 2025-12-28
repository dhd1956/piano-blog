'use client'

import { usePathname } from 'next/navigation'
import siteMetadata from '@/data/siteMetadata'
import headerNavLinks from '@/data/headerNavLinks'
import Logo from '@/data/logo.svg'
import Link from './Link'
import MobileNav from './MobileNav'
import ThemeSwitch from './ThemeSwitch'
import SearchButton from './SearchButton'
import AuthButton from './AuthButton'
import DropdownNav from './DropdownNav'

const Header = () => {
  const pathname = usePathname()

  // Show blog title on blog pages, network title everywhere else
  const isBlogPage = pathname?.startsWith('/blog') || pathname?.startsWith('/tags')
  const displayTitle = isBlogPage ? siteMetadata.blogTitle : siteMetadata.networkTitle
  const linkHref = isBlogPage ? '/blog' : '/'

  let headerClass = 'flex items-center w-full bg-white dark:bg-gray-950 justify-between py-10'
  if (siteMetadata.stickyNav) {
    headerClass += ' sticky top-0 z-50'
  }

  return (
    <header className={headerClass}>
      <Link href={linkHref} aria-label={displayTitle}>
        <div className="flex items-center justify-between">
          <div className="mr-3">
            <Logo />
          </div>
          {typeof displayTitle === 'string' ? (
            <div className="hidden h-6 text-2xl font-semibold sm:block">{displayTitle}</div>
          ) : (
            displayTitle
          )}
        </div>
      </Link>
      <div className="flex items-center space-x-4 leading-5 sm:-mr-6 sm:space-x-6">
        <div className="no-scrollbar hidden items-center gap-x-4 sm:flex">
          {headerNavLinks.map((navGroup) =>
            navGroup.type === 'link' && navGroup.href ? (
              <Link
                key={navGroup.title}
                href={navGroup.href}
                className="hover:text-primary-500 dark:hover:text-primary-400 m-1 font-medium text-gray-900 dark:text-gray-100"
              >
                {navGroup.title}
              </Link>
            ) : (
              navGroup.type === 'dropdown' &&
              navGroup.items && (
                <DropdownNav key={navGroup.title} title={navGroup.title} items={navGroup.items} />
              )
            )
          )}
        </div>
        <SearchButton />
        <ThemeSwitch />
        <AuthButton />
        <MobileNav />
      </div>
    </header>
  )
}

export default Header
