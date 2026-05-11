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
  CreatePosition,
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
        items: [
          {
            title: "View Positions",
            url: "/positions",
            isActive: false,
          },
          {
            title: "Create Position",
            url: "/positions/create",
            isActive: false,
          },
        ],
      },
    ],
  }

  switch (activeItem) {
    case NavBarItemType.Dashboard:
      navBar.navMain[0].isActive = true
      break
    case NavBarItemType.ViewPositions:
      if (navBar.navMain[1].items) {
        navBar.navMain[1].items[0].isActive = true
      }
      break
    case NavBarItemType.CreatePosition:
      if (navBar.navMain[1].items) {
        navBar.navMain[1].items[1].isActive = true
      }
      break
  }
  return navBar
}
