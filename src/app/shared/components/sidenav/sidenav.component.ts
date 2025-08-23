import { Component, OnInit } from '@angular/core';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

interface NavItem {
  icon: string;
  label: string;
  route?: string;
  children?: NavItem[];
  hidden?: boolean; // <-- OCULTAR, SI VAS A OCULTAR ALGO DARWIN, USA ESTO
}

@Component({
  selector: 'app-sidenav',
  standalone: true,
  imports: [CommonModule, MatListModule, MatIconModule, RouterModule],
  templateUrl: './sidenav.component.html',
  styleUrl: './sidenav.component.css',
})
export class SidenavComponent implements OnInit {
  public menuItems: NavItem[] = [];
  public expandedItems = new Set<NavItem>();

  private readonly _sourceMenuItems: NavItem[] = [
    { icon: 'dashboard', label: 'Dashboard', route: '/dashboard' },
    { icon: 'route', label: 'Rutas', route: '/rutas' },
    { icon: 'timeline', label: 'Recorridos', route: '/recorridos' },
    { icon: 'miscellaneous_services', label: 'Servicios', route: '/servicios' },
    {
      icon: 'analytics',
      label: 'Reportes',
      hidden: true, //OCULTA
      children: [
        { icon: 'article', label: 'Reporte A', route: '/reports/a' },
        { icon: 'assessment', label: 'Reporte B', route: '/reports/b' },
      ],
    },
    {
      icon: 'collections_bookmark',
      label: 'Catálogos',
      children: [
        { icon: 'person', label: 'Clientes', route: '/catalogs/clientes' },
        {
          icon: 'local_shipping',
          label: 'Unidades',
          route: '/catalogs/unidades',
        },
      ],
    },
    {
      icon: 'settings',
      label: 'Configuración',
      hidden: true, // <--- OCULTAR ESTE ELEMENTO
      children: [
        {
          icon: 'manage_accounts',
          label: 'Usuario',
          route: '/settings/usuario',
        },
        { icon: 'badge', label: 'Perfil', route: '/settings/perfil' },
      ],
    },
  ];

  ngOnInit(): void {
    this.rebuildMenu();
  }
  toggleSubMenu(item: NavItem): void {
    if (this.expandedItems.has(item)) {
      this.expandedItems.delete(item);
    } else {
      this.expandedItems.add(item);
    }
    this.rebuildMenu();
  }
  private rebuildMenu(): void {
    const newMenuItems: NavItem[] = [];
    //   for (const item of this._sourceMenuItems) {
    //     newMenuItems.push(item);
    //     if (item.children && this.expandedItems.has(item)) {
    //       newMenuItems.push(...item.children);
    //     }
    //   }
    //   this.menuItems = newMenuItems;
    // }
    const visibleSourceItems = this._sourceMenuItems.filter(
      //Quitar en caso de problemas
      (item) => !item.hidden
    );

    for (const item of visibleSourceItems) {
      newMenuItems.push(item);
      if (item.children && this.expandedItems.has(item)) {
        // No es necesario filtrar los hijos, ya que el padre está oculto
        newMenuItems.push(...item.children);
      }
    }
    this.menuItems = newMenuItems;
  }
  //Logica para mostrar los componenentes que quieras, usando el hidden
  // True OCULTAR
}
