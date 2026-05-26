interface sidebarItems {
  navMain: {
    title: string
    url?: string
    isActive?: boolean
    items?: {
      title: string
      url: string
      isActive?: boolean
    }[]
  }[]
}

export enum NavBarItemType {
  Dashboard,
  ViewPositions,
  ViewCandidates
}

export function getNavBar(activeItem: NavBarItemType) {
  var navBar: sidebarItems = {
    navMain: [
      {
        title: "Dashboard",
        url: "/dashboard",
        isActive: false,
      },
      {
        title: "Positions",
        url: "/positions",
        isActive: false,
      },
      {
        title: "Candidates",
        url: "/candidates",
        isActive: false,
      }
    ],
  }

  switch (activeItem) {
    case NavBarItemType.Dashboard:
      navBar.navMain[0].isActive = true
      break
    case NavBarItemType.ViewPositions:
      navBar.navMain[1].isActive = true
      break
    case NavBarItemType.ViewCandidates:
      navBar.navMain[2].isActive = true
      break
  }
  return navBar
}
