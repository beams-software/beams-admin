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
  ViewCandidates,
  ViewVoters,
  ViewLiveFeed
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
      },
      {
        title: "Voters",
        url: "/voters",
        isActive: false,
      },
      {
        title: "Live Feed",
        url: "/live-feed",
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
    case NavBarItemType.ViewVoters:
      navBar.navMain[3].isActive = true
      break
    case NavBarItemType.ViewLiveFeed:
      navBar.navMain[4].isActive = true
      break
  }
  return navBar
}
