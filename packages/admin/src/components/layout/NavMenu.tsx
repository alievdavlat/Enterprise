import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarGroupLabel,
} from "@enterprise/design-system";
import { NavMenuItem, NavMenuItemProps } from "./NavMenuItem";

interface NavMenuProps {
  title?: string;
  items: NavMenuItemProps[];
}
const NavMenu = ({ title, items }: NavMenuProps) => {
  return (
    <SidebarGroup>
      {title ? (
        <SidebarGroupLabel className="px-3 mb-1 uppercase tracking-wider text-muted-foreground group-data-[collapsible=icon]:hidden group-data-[collapsible=icon]:mb-0">
          {title}
        </SidebarGroupLabel>
      ) : null}
      <SidebarGroupContent>
        <SidebarMenu className="flex flex-col gap-2">
          {items.map((item) => (
            <NavMenuItem key={`nav-${item.id ?? item.href}`} {...item} />
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
};

export default NavMenu;
