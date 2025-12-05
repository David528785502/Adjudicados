import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

import { ApiService } from './services/api.service';
import {
  PostulanteConEstado,
  PlazaConDisponibilidad,
  GrupoOcupacional,
  Red,
  EstadoAdjudicacion,
  FiltroPostulantes,
  FiltroPlazas,
  RequestAdjudicar
} from './models/interfaces';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    HttpClientModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatSnackBarModule
  ],
  template: `
    <!-- Header -->
    <div class="app-header">
      <h1>EsSalud - Sistema de Adjudicaciones</h1>
      <p>Gestión de Postulantes y Plazas Disponibles</p>
    </div>

    <div class="main-container">
      <!-- Contenedor de las 2 tablas -->
      <div class="tables-container">
        
        <!-- TABLA IZQUIERDA: Postulantes -->
        <div class="table-section">
          <h2 class="section-title">
            <mat-icon>people</mat-icon>
            Postulantes ({{postulantes.length}})
          </h2>

          <!-- Filtros para postulantes -->
          <div class="filters-container">
            <mat-form-field appearance="outline">
              <mat-label>Grupo Ocupacional</mat-label>
              <mat-select [(value)]="filtroPostulantes.grupoOcupacionalId" 
                         (selectionChange)="filtrarPostulantes()">
                <mat-option [value]="undefined">Todos</mat-option>
                <mat-option *ngFor="let grupo of gruposOcupacionales" [value]="grupo.id">
                  {{grupo.nombre}}
                </mat-option>
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Estado</mat-label>
              <mat-select [(value)]="filtroPostulantes.estado" 
                         (selectionChange)="filtrarPostulantes()">
                <mat-option [value]="undefined">Todos</mat-option>
                <mat-option value="pendiente">Pendiente</mat-option>
                <mat-option value="adjudicado">Adjudicado</mat-option>
                <mat-option value="desistido">Desistido</mat-option>
                <mat-option value="renuncio">Renunció</mat-option>
              </mat-select>
            </mat-form-field>
          </div>

          <!-- Tabla de postulantes -->
          <div class="table-responsive">
            <table mat-table [dataSource]="postulantes" class="mat-elevation-2">
              
              <!-- Columna Orden Mérito -->
              <ng-container matColumnDef="orden">
                <th mat-header-cell *matHeaderCellDef>OM</th>
                <td mat-cell *matCellDef="let postulante">{{postulante.orden_merito}}</td>
              </ng-container>

              <!-- Columna Nombres -->
              <ng-container matColumnDef="nombres">
                <th mat-header-cell *matHeaderCellDef>Apellidos y Nombres</th>
                <td mat-cell *matCellDef="let postulante">{{postulante.apellidos_nombres}}</td>
              </ng-container>

              <!-- DNI removed: not available in dataset -->

              <!-- Columna Estado -->
              <ng-container matColumnDef="estado">
                <th mat-header-cell *matHeaderCellDef>Estado</th>
                <td mat-cell *matCellDef="let postulante">
                  <span [class]="'badge badge-' + getBadgeClass(postulante.estado)">
                    {{getEstadoTexto(postulante.estado)}}
                  </span>
                </td>
              </ng-container>

              <!-- Columna IPRESS Adjudicada -->
              <ng-container matColumnDef="ipress">
                <th mat-header-cell *matHeaderCellDef>IPRESS</th>
                <td mat-cell *matCellDef="let postulante">
                  {{postulante.ipress_adjudicada || '-'}}
                </td>
              </ng-container>

              <!-- Columna Acciones -->
              <ng-container matColumnDef="acciones">
                <th mat-header-cell *matHeaderCellDef>Acciones</th>
                <td mat-cell *matCellDef="let postulante">
                  <div class="action-buttons">
                    <button mat-raised-button color="primary" 
                           [disabled]="postulante.estado !== 'pendiente'"
                           (click)="adjudicar(postulante)">
                      <mat-icon>assignment</mat-icon>
                      Adjudicar
                    </button>
                    
                    <button mat-raised-button color="warn"
                           [disabled]="postulante.estado === 'desistido' || postulante.estado === 'renuncio'"
                           (click)="desistir(postulante)">
                      <mat-icon>cancel</mat-icon>
                      Desistir
                    </button>
                    
                    <button mat-raised-button color="accent"
                           [disabled]="postulante.estado !== 'adjudicado'"
                           (click)="renunciar(postulante)">
                      <mat-icon>exit_to_app</mat-icon>
                      Renunciar
                    </button>
                  </div>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="columnasPostulantes"></tr>
              <tr mat-row *matRowDef="let row; columns: columnasPostulantes;"></tr>
            </table>
          </div>

          <!-- Loading postulantes -->
          <div *ngIf="loadingPostulantes" class="loading-container">
            <mat-spinner diameter="50"></mat-spinner>
          </div>
        </div>

        <!-- TABLA DERECHA: IPRESS y Plazas -->
        <div class="table-section">
          <h2 class="section-title">
            <mat-icon>business</mat-icon>
            IPRESS - Plazas Disponibles ({{plazas.length}})
          </h2>

          <!-- Filtros para plazas -->
          <div class="filters-container">
            <mat-form-field appearance="outline">
              <mat-label>Red</mat-label>
              <mat-select [(value)]="filtroPlazas.redId" 
                         (selectionChange)="filtrarPlazas()">
                <mat-option [value]="undefined">Todas</mat-option>
                <mat-option *ngFor="let red of redes" [value]="red.id">
                  {{red.nombre}}
                </mat-option>
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Grupo Ocupacional</mat-label>
              <mat-select [(value)]="filtroPlazas.grupoOcupacionalId" 
                         (selectionChange)="filtrarPlazas()">
                <mat-option [value]="undefined">Todos</mat-option>
                <mat-option *ngFor="let grupo of gruposOcupacionales" [value]="grupo.id">
                  {{grupo.nombre}}
                </mat-option>
              </mat-select>
            </mat-form-field>
          </div>

          <!-- Tabla de plazas -->
          <div class="table-responsive">
            <table mat-table [dataSource]="plazas" class="mat-elevation-2">
              
              <!-- Columna Red -->
              <ng-container matColumnDef="red">
                <th mat-header-cell *matHeaderCellDef>Red</th>
                <td mat-cell *matCellDef="let plaza">{{plaza.red}}</td>
              </ng-container>

              <!-- Columna IPRESS -->
              <ng-container matColumnDef="ipress">
                <th mat-header-cell *matHeaderCellDef>IPRESS</th>
                <td mat-cell *matCellDef="let plaza">{{plaza.ipress}}</td>
              </ng-container>

              <!-- Columna Grupo Ocupacional -->
              <ng-container matColumnDef="grupo">
                <th mat-header-cell *matHeaderCellDef>Grupo Ocupacional</th>
                <td mat-cell *matCellDef="let plaza">{{plaza.grupo_ocupacional}}</td>
              </ng-container>

              <!-- Columna Subunidad -->
              <ng-container matColumnDef="subunidad">
                <th mat-header-cell *matHeaderCellDef>Subunidad</th>
                <td mat-cell *matCellDef="let plaza">{{plaza.subunidad || '-'}}</td>
              </ng-container>

              <!-- Columna Especialidad -->
              <ng-container matColumnDef="especialidad">
                <th mat-header-cell *matHeaderCellDef>Especialidad</th>
                <td mat-cell *matCellDef="let plaza">{{plaza.especialidad || '-'}}</td>
              </ng-container>

              <!-- Columna Total -->
              <ng-container matColumnDef="total">
                <th mat-header-cell *matHeaderCellDef>Total</th>
                <td mat-cell *matCellDef="let plaza">{{plaza.total}}</td>
              </ng-container>

              <!-- Columna Asignados -->
              <ng-container matColumnDef="asignados">
                <th mat-header-cell *matHeaderCellDef>Asignados</th>
                <td mat-cell *matCellDef="let plaza">{{plaza.asignados}}</td>
              </ng-container>

              <!-- Columna Libres -->
              <ng-container matColumnDef="libres">
                <th mat-header-cell *matHeaderCellDef>Libres</th>
                <td mat-cell *matCellDef="let plaza">
                  <span [class]="plaza.libres > 0 ? 'disponible' : 'no-disponible'">
                    {{plaza.libres}}
                  </span>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="columnasPlazas"></tr>
              <tr mat-row *matRowDef="let row; columns: columnasPlazas;"></tr>
            </table>
          </div>

          <!-- Loading plazas -->
          <div *ngIf="loadingPlazas" class="loading-container">
            <mat-spinner diameter="50"></mat-spinner>
          </div>
        </div>
      </div>

      <!-- Botones inferiores -->
      <div class="bottom-buttons">
        <button mat-raised-button color="primary" disabled>
          <mat-icon>picture_as_pdf</mat-icon>
          Crear PDF
        </button>
        
        <button mat-raised-button color="accent" disabled>
          <mat-icon>file_download</mat-icon>
          Crear Excel
        </button>
      </div>
    </div>

    <!-- Modal de Adjudicación -->
    <div class="modal-backdrop" *ngIf="mostrarModalAdjudicacion" (click)="cerrarModalAdjudicacion()">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h2>Adjudicar Postulante</h2>
          <button mat-icon-button (click)="cerrarModalAdjudicacion()">
            <mat-icon>close</mat-icon>
          </button>
        </div>

        <div class="modal-body" *ngIf="postulanteSeleccionado">
          <div class="info-banner">
            <mat-icon>info</mat-icon>
            <span>Puedes adjudicar a cualquier plaza disponible de cualquier red o grupo ocupacional</span>
          </div>
          
          <div class="postulante-info">
            <h3>Postulante Seleccionado</h3>
            <p><strong>Nombre:</strong> {{postulanteSeleccionado.apellidos_nombres}}</p>
            <p><strong>Orden de Mérito:</strong> {{postulanteSeleccionado.orden_merito}}</p>
            <p><strong>Grupo Ocupacional:</strong> {{postulanteSeleccionado.grupo_ocupacional}}</p>
          </div>

          <div class="plazas-disponibles">
            <div class="plazas-header">
              <h3>Seleccionar Plaza</h3>
              <div class="plazas-counter">
                <span class="badge">{{plazasFiltradasModal.length}} de {{plazasDisponibles.length}} plazas</span>
              </div>
            </div>
            
            <!-- Filtros del Modal -->
            <div class="filtros-modal">
              <div class="filtros-row">
                <mat-form-field appearance="outline" class="filtro-field">
                  <mat-label>Filtrar por Red</mat-label>
                  <input matInput 
                         [(ngModel)]="filtroModalRed" 
                         (input)="filtrarPlazasModal()" 
                         placeholder="Escriba para buscar...">
                  <button matSuffix mat-icon-button *ngIf="filtroModalRed" (click)="filtroModalRed = ''; filtrarPlazasModal()">
                    <mat-icon>clear</mat-icon>
                  </button>
                </mat-form-field>

                <mat-form-field appearance="outline" class="filtro-field">
                  <mat-label>Filtrar por Grupo</mat-label>
                  <input matInput 
                         [(ngModel)]="filtroModalGrupo" 
                         (input)="filtrarPlazasModal()" 
                         placeholder="Escriba para buscar...">
                  <button matSuffix mat-icon-button *ngIf="filtroModalGrupo" (click)="filtroModalGrupo = ''; filtrarPlazasModal()">
                    <mat-icon>clear</mat-icon>
                  </button>
                </mat-form-field>

                <mat-form-field appearance="outline" class="filtro-field">
                  <mat-label>Filtrar por IPRESS</mat-label>
                  <input matInput 
                         [(ngModel)]="filtroModalIpress" 
                         (input)="filtrarPlazasModal()" 
                         placeholder="Escriba para buscar...">
                  <button matSuffix mat-icon-button *ngIf="filtroModalIpress" (click)="filtroModalIpress = ''; filtrarPlazasModal()">
                    <mat-icon>clear</mat-icon>
                  </button>
                </mat-form-field>

                <button mat-icon-button 
                        color="accent" 
                        (click)="limpiarFiltrosModal()" 
                        matTooltip="Limpiar todos los filtros">
                  <mat-icon>filter_list_off</mat-icon>
                </button>
              </div>
            </div>
            
            <div class="plazas-list">
              <!-- Mensaje cuando no hay resultados -->
              <div *ngIf="plazasFiltradasModal.length === 0" class="no-results">
                <mat-icon>search_off</mat-icon>
                <p>No se encontraron plazas con los filtros aplicados</p>
                <button mat-stroked-button (click)="limpiarFiltrosModal()">
                  <mat-icon>refresh</mat-icon>
                  Limpiar Filtros
                </button>
              </div>

              <!-- Lista de plazas filtradas -->
              <div 
                *ngFor="let plaza of plazasFiltradasModal" 
                class="plaza-item"
                [class.selected]="plazaSeleccionada?.id === plaza.id"
                (click)="seleccionarPlaza(plaza)">
                
                <div class="plaza-info">
                  <div class="plaza-header">
                    <span class="red-badge">{{plaza.red}}</span>
                    <span class="grupo-badge">{{plaza.grupo_ocupacional}}</span>
                    <span class="libres-badge">{{plaza.libres}} libres</span>
                  </div>
                  <div class="plaza-details">
                    <strong>{{plaza.ipress}}</strong>
                    <span class="subunidad" *ngIf="plaza.subunidad"> | {{plaza.subunidad}}</span>
                    <span class="especialidad" *ngIf="plaza.especialidad"> - {{plaza.especialidad}}</span>
                  </div>
                  <div class="plaza-stats">
                    Total: {{plaza.total}} | Asignados: {{plaza.asignados}} | Libres: {{plaza.libres}}
                  </div>
                </div>

                <div class="plaza-actions">
                  <mat-icon *ngIf="plazaSeleccionada?.id === plaza.id" color="primary">check_circle</mat-icon>
                  <mat-icon *ngIf="plazaSeleccionada?.id !== plaza.id">radio_button_unchecked</mat-icon>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button mat-button (click)="cerrarModalAdjudicacion()">
            <mat-icon>cancel</mat-icon>
            Cancelar
          </button>
          <button 
            mat-raised-button 
            color="primary" 
            [disabled]="!plazaSeleccionada || loadingPostulantes"
            (click)="confirmarAdjudicacion()">
            <mat-icon>assignment_turned_in</mat-icon>
            <span *ngIf="!loadingPostulantes">Confirmar Adjudicación</span>
            <span *ngIf="loadingPostulantes">Adjudicando...</span>
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    /* Modal Styles */
    .modal-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background-color: rgba(0, 0, 0, 0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1000;
    }

    .modal-content {
      background: white;
      border-radius: 8px;
      max-width: 800px;
      max-height: 80vh;
      width: 90%;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px;
      border-bottom: 1px solid #e0e0e0;
      background-color: #f5f5f5;
    }

    .modal-header h2 {
      margin: 0;
      color: #1976d2;
    }

    .info-banner {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 16px;
      background-color: #e3f2fd;
      border: 1px solid #2196f3;
      border-radius: 4px;
      margin-bottom: 16px;
      color: #1976d2;
      font-size: 14px;
    }
    
    .info-banner mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    .modal-body {
      padding: 20px;
      flex: 1;
      overflow-y: auto;
    }

    .postulante-info {
      background-color: #e3f2fd;
      padding: 15px;
      border-radius: 4px;
      margin-bottom: 20px;
    }

    .postulante-info h3 {
      margin: 0 0 10px 0;
      color: #1976d2;
    }

    .postulante-info p {
      margin: 5px 0;
    }

    .plazas-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 15px;
    }

    .plazas-header h3 {
      margin: 0;
      color: #1976d2;
    }

    .plazas-counter .badge {
      background-color: #ff9800;
      color: white;
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: bold;
    }

    .filtros-modal {
      margin-bottom: 15px;
      padding: 15px;
      background-color: #f8f9fa;
      border-radius: 4px;
      border: 1px solid #e9ecef;
    }

    .filtros-row {
      display: flex;
      gap: 15px;
      align-items: flex-end;
      flex-wrap: wrap;
    }

    .filtro-field {
      flex: 1;
      min-width: 200px;
    }

    .plazas-list {
      max-height: 300px;
      overflow-y: auto;
      border: 1px solid #e0e0e0;
      border-radius: 4px;
    }

    .plaza-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px;
      border-bottom: 1px solid #f0f0f0;
      cursor: pointer;
      transition: background-color 0.2s;
    }

    .plaza-item:hover {
      background-color: #f5f5f5;
    }

    .plaza-item.selected {
      background-color: #e3f2fd;
      border-left: 4px solid #1976d2;
    }

    .plaza-item:last-child {
      border-bottom: none;
    }

    .plaza-info {
      flex: 1;
    }

    .plaza-header {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 5px;
    }

    .red-badge {
      background-color: #1976d2;
      color: white;
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: bold;
    }

    .grupo-badge {
      background-color: #9c27b0;
      color: white;
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: bold;
    }

    .libres-badge {
      background-color: #4caf50;
      color: white;
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: bold;
    }

    .no-results {
      text-align: center;
      padding: 40px 20px;
      color: #666;
    }

    .no-results mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      color: #ccc;
      margin-bottom: 10px;
    }

    .no-results p {
      margin: 10px 0;
      font-size: 16px;
    }

    .plaza-details {
      font-weight: bold;
      margin-bottom: 5px;
    }

    .especialidad {
      color: #666;
      font-weight: normal;
    }

    .plaza-stats {
      font-size: 12px;
      color: #666;
    }

    .plaza-actions {
      padding: 0 10px;
    }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      padding: 20px;
      border-top: 1px solid #e0e0e0;
      background-color: #f5f5f5;
    }
  `]
})
export class AppComponent implements OnInit {
  title = 'EsSalud Adjudicaciones';

  // Datos de las tablas
  postulantes: PostulanteConEstado[] = [];
  plazas: PlazaConDisponibilidad[] = [];
  gruposOcupacionales: GrupoOcupacional[] = [];
  redes: Red[] = [];

  // Estados de carga
  loadingPostulantes = false;
  loadingPlazas = false;

  // Columnas de las tablas
  columnasPostulantes: string[] = ['orden', 'nombres', 'estado', 'ipress', 'acciones'];
  columnasPlazas: string[] = ['red', 'ipress', 'grupo', 'subunidad', 'especialidad', 'total', 'asignados', 'libres'];

  // Filtros
  filtroPostulantes: FiltroPostulantes = {};
  filtroPlazas: FiltroPlazas = {};

  // Modal de adjudicación
  mostrarModalAdjudicacion = false;
  postulanteSeleccionado: PostulanteConEstado | null = null;
  plazasDisponibles: PlazaConDisponibilidad[] = [];
  plazasFiltradasModal: PlazaConDisponibilidad[] = [];
  plazaSeleccionada: PlazaConDisponibilidad | null = null;
  
  // Filtros del modal
  filtroModalRed: string = '';
  filtroModalGrupo: string = '';
  filtroModalIpress: string = '';

  private apiService = inject(ApiService);
  private snackBar = inject(MatSnackBar);

  ngOnInit() {
    console.log('Iniciando carga de datos...');
    console.log('API URL:', 'http://localhost:3000/api');
    this.cargarDatos();
  }

  /**
   * Cargar todos los datos iniciales
   */
  cargarDatos() {
    console.log('Iniciando carga de datos...');
    console.log('Verificando conexión con backend...');
    
    // Primero cargar datos de referencia
    this.cargarGruposOcupacionales();
    this.cargarRedes();
    
    // Luego cargar datos principales
    setTimeout(() => {
      console.log('Cargando datos principales después de 1 segundo...');
      this.cargarPostulantes();
      this.cargarPlazas();
    }, 1000);
  }

  /**
   * Cargar postulantes con estado
   */
  cargarPostulantes() {
    this.loadingPostulantes = true;
    this.apiService.getPostulantesConEstado().subscribe({
      next: (response: any) => {
        console.log('Respuesta postulantes:', response);
        this.postulantes = (response.data || response || []).slice().sort((a: any, b: any) => (a.orden_merito || 0) - (b.orden_merito || 0));
        this.loadingPostulantes = false;
      },
      error: (error: any) => {
        console.error('Error al cargar postulantes:', error);
        console.error('Status:', error.status);
        console.error('Message:', error.message);
        console.error('URL:', error.url);
        
        let errorMsg = 'Error al cargar postulantes';
        if (error.status === 0) {
          errorMsg = 'No se pudo conectar con el servidor. ¿Está el backend ejecutándose en http://localhost:3000?';
        } else if (error.status >= 400 && error.status < 500) {
          errorMsg = `Error del cliente: ${error.status}`;
        } else if (error.status >= 500) {
          errorMsg = `Error del servidor: ${error.status}`;
        }
        
        this.mostrarError(errorMsg);
        this.loadingPostulantes = false;
        this.postulantes = [];
      }
    });
  }

  /**
   * Cargar plazas con disponibilidad
   */
  cargarPlazas() {
    this.loadingPlazas = true;
    this.apiService.getPlazasConDisponibilidad().subscribe({
      next: (response: any) => {
        console.log('Respuesta plazas:', response);
        this.plazas = response.data || response || [];
        this.loadingPlazas = false;
      },
      error: (error: any) => {
        console.error('Error al cargar plazas:', error);
        console.error('Status:', error.status);
        console.error('Message:', error.message);
        console.error('URL:', error.url);
        
        let errorMsg = 'Error al cargar plazas';
        if (error.status === 0) {
          errorMsg = 'No se pudo conectar con el servidor. ¿Está el backend ejecutándose en http://localhost:3000?';
        } else if (error.status >= 400 && error.status < 500) {
          errorMsg = `Error del cliente: ${error.status}`;
        } else if (error.status >= 500) {
          errorMsg = `Error del servidor: ${error.status}`;
        }
        
        this.mostrarError(errorMsg);
        this.loadingPlazas = false;
        this.plazas = [];
      }
    });
  }

  /**
   * Cargar grupos ocupacionales
   */
  cargarGruposOcupacionales() {
    this.apiService.getGruposOcupacionales().subscribe({
      next: (response) => {
        this.gruposOcupacionales = response.data;
      },
      error: (error) => {
        console.error('Error al cargar grupos ocupacionales:', error);
      }
    });
  }

  /**
   * Cargar redes
   */
  cargarRedes() {
    this.apiService.getRedes().subscribe({
      next: (response) => {
        this.redes = response.data;
      },
      error: (error) => {
        console.error('Error al cargar redes:', error);
      }
    });
  }

  /**
   * Filtrar postulantes
   */
  filtrarPostulantes() {
    this.loadingPostulantes = true;
    this.apiService.getPostulantes(this.filtroPostulantes).subscribe({
      next: (response) => {
        this.postulantes = (response.data || []).slice().sort((a: any, b: any) => (a.orden_merito || 0) - (b.orden_merito || 0));
        this.loadingPostulantes = false;
      },
      error: (error) => {
        console.error('Error al filtrar postulantes:', error);
        this.mostrarError('Error al filtrar postulantes');
        this.loadingPostulantes = false;
      }
    });
  }

  /**
   * Filtrar plazas
   */
  filtrarPlazas() {
    // Sanitize filtros: only pass numeric values
    this.loadingPlazas = true;
    const filtros: any = {};
    if (this.filtroPlazas.redId !== undefined && this.filtroPlazas.redId !== null) {
      const redIdNum = Number(this.filtroPlazas.redId);
      if (!Number.isNaN(redIdNum)) filtros.redId = redIdNum;
    }
    if (this.filtroPlazas.grupoOcupacionalId !== undefined && this.filtroPlazas.grupoOcupacionalId !== null) {
      const grupoIdNum = Number(this.filtroPlazas.grupoOcupacionalId);
      if (!Number.isNaN(grupoIdNum)) filtros.grupoOcupacionalId = grupoIdNum;
    }

    console.log('Filtrando plazas con filtros sanitizados:', filtros);

    this.apiService.getPlazasConDisponibilidad(filtros).subscribe({
      next: (response: any) => {
        console.log('Respuesta filtrarPlazas:', response);
        this.plazas = response.data || [];
        this.loadingPlazas = false;
      },
      error: (error: any) => {
        console.error('Error al filtrar plazas:', error);
        console.error('Status:', error.status);
        console.error('Response body:', error.error);
        this.mostrarError(`Error al filtrar plazas: ${error.status || 'desconocido'}`);
        this.loadingPlazas = false;
      }
    });
  }

  /**
   * Adjudicar postulante - mostrar plazas disponibles para selección
   */
  adjudicar(postulante: PostulanteConEstado) {
    console.log(`Iniciando selección de plaza para ${postulante.apellidos_nombres} (OM: ${postulante.orden_merito})`);
    
    // Validar que el postulante puede ser adjudicado
    if (postulante.estado !== 'pendiente') {
      this.mostrarError(`No se puede adjudicar: el postulante ya está en estado "${postulante.estado}"`);
      return;
    }
    
    // Guardar el postulante seleccionado
    this.postulanteSeleccionado = postulante;
    
    // Buscar TODAS las plazas disponibles (sin restricción de grupo ocupacional)
    const filtros: FiltroPlazas = { 
      soloDisponibles: true // Solo mostrar plazas con cupos libres
    };
    
    console.log('Buscando TODAS las plazas disponibles para selección libre:', filtros);
    
    this.apiService.getPlazasConDisponibilidad(filtros).subscribe({
      next: (response) => {
        if (response.success && response.data && response.data.length > 0) {
          this.plazasDisponibles = response.data;
          this.plazasFiltradasModal = [...response.data]; // Copia inicial sin filtros
          this.plazaSeleccionada = null; // Resetear selección
          
          // Resetear filtros del modal
          this.filtroModalRed = '';
          this.filtroModalGrupo = '';
          this.filtroModalIpress = '';
          
          this.mostrarModalAdjudicacion = true; // Mostrar modal
          console.log(`Encontradas ${response.data.length} plazas disponibles`);
        } else {
          this.mostrarError(`No hay plazas disponibles para el grupo ocupacional "${postulante.grupo_ocupacional}"`);
        }
      },
      error: (error) => {
        console.error('Error al buscar plazas disponibles:', error);
        this.mostrarError(`Error al buscar plazas disponibles: ${error.error?.message || error.message}`);
      }
    });
  }
  
  /**
   * Confirmar adjudicación de la plaza seleccionada
   */
  confirmarAdjudicacion() {
    if (!this.postulanteSeleccionado || !this.plazaSeleccionada) {
      this.mostrarError('Debe seleccionar una plaza');
      return;
    }

    this.loadingPostulantes = true;
    this.loadingPlazas = true;
    
    const adjudicacionData: RequestAdjudicar = {
      postulanteId: this.postulanteSeleccionado.id,
      plazaId: this.plazaSeleccionada.id,
      observaciones: `Adjudicación manual - OM: ${this.postulanteSeleccionado.orden_merito} a ${this.plazaSeleccionada.red} - ${this.plazaSeleccionada.ipress}`
    };
    
    console.log('Realizando adjudicación:', adjudicacionData);
    
    this.apiService.adjudicar(adjudicacionData).subscribe({
      next: (response) => {
        if (response.success) {
          this.mostrarExito(`${this.postulanteSeleccionado!.apellidos_nombres} adjudicado exitosamente a ${this.plazaSeleccionada!.red} - ${this.plazaSeleccionada!.ipress}`);
          
          // Cerrar modal
          this.cerrarModalAdjudicacion();
          
          // Recargar datos
          this.recargarDatos();
        } else {
          this.mostrarError(`Error en adjudicación: ${response.message || 'Error desconocido'}`);
          this.loadingPostulantes = false;
          this.loadingPlazas = false;
        }
      },
      error: (error) => {
        console.error('Error al adjudicar:', error);
        this.mostrarError(`Error al adjudicar: ${error.error?.message || error.message || 'Error de conexión'}`);
        this.loadingPostulantes = false;
        this.loadingPlazas = false;
      }
    });
  }

  /**
   * Cancelar adjudicación y cerrar modal
   */
  cerrarModalAdjudicacion() {
    this.mostrarModalAdjudicacion = false;
    this.postulanteSeleccionado = null;
    this.plazasDisponibles = [];
    this.plazasFiltradasModal = [];
    this.plazaSeleccionada = null;
    
    // Limpiar filtros
    this.filtroModalRed = '';
    this.filtroModalGrupo = '';
    this.filtroModalIpress = '';
  }

  /**
   * Seleccionar una plaza del modal
   */
  seleccionarPlaza(plaza: PlazaConDisponibilidad) {
    this.plazaSeleccionada = plaza;
    console.log('Plaza seleccionada:', plaza);
  }

  /**
   * Filtrar plazas en el modal
   */
  filtrarPlazasModal() {
    console.log('Aplicando filtros modal:', {
      red: this.filtroModalRed,
      grupo: this.filtroModalGrupo,
      ipress: this.filtroModalIpress
    });

    this.plazasFiltradasModal = this.plazasDisponibles.filter(plaza => {
      // Filtro por red
      const cumpleRed = !this.filtroModalRed || 
        plaza.red.toLowerCase().includes(this.filtroModalRed.toLowerCase());
      
      // Filtro por grupo ocupacional
      const cumpleGrupo = !this.filtroModalGrupo || 
        plaza.grupo_ocupacional.toLowerCase().includes(this.filtroModalGrupo.toLowerCase());
      
      // Filtro por IPRESS
      const cumpleIpress = !this.filtroModalIpress || 
        plaza.ipress.toLowerCase().includes(this.filtroModalIpress.toLowerCase());
      
      return cumpleRed && cumpleGrupo && cumpleIpress;
    });

    console.log(`Filtrado: ${this.plazasFiltradasModal.length} de ${this.plazasDisponibles.length} plazas`);
    
    // Si la plaza seleccionada ya no está en los resultados filtrados, deseleccionarla
    if (this.plazaSeleccionada && 
        !this.plazasFiltradasModal.find(p => p.id === this.plazaSeleccionada!.id)) {
      this.plazaSeleccionada = null;
    }
  }

  /**
   * Limpiar todos los filtros del modal
   */
  limpiarFiltrosModal() {
    this.filtroModalRed = '';
    this.filtroModalGrupo = '';
    this.filtroModalIpress = '';
    this.filtrarPlazasModal();
  }

  /**
   * Recargar todos los datos (postulantes, plazas, etc.)
   */
  recargarDatos() {
    console.log('Recargando todos los datos...');
    
    // Recargar postulantes
    this.cargarPostulantes();
    
    // Recargar plazas  
    this.cargarPlazas();
    
    // Si hay filtros activos, volver a aplicarlos después de un breve delay
    setTimeout(() => {
      if (this.filtroPlazas.redId || this.filtroPostulantes.grupoOcupacionalId) {
        this.filtrarPlazas();
      }
      if (this.filtroPostulantes.grupoOcupacionalId) {
        this.filtrarPostulantes();
      }
    }, 1000); // Dar tiempo para que se recarguen los datos
  }

  /**
   * Marcar como desistido
   */
  desistir(postulante: PostulanteConEstado) {
    if (confirm(`¿Está seguro de marcar como DESISTIDO a ${postulante.apellidos_nombres}?`)) {
      this.apiService.desistir(postulante.id, { 
        postulanteId: postulante.id,
        observaciones: 'Desistimiento registrado desde frontend' 
      }).subscribe({
        next: (response) => {
          this.mostrarExito('Postulante marcado como desistido');
          this.cargarPostulantes();
        },
        error: (error) => {
          console.error('Error al desistir:', error);
          this.mostrarError('Error al registrar desistimiento');
        }
      });
    }
  }

  /**
   * Marcar como renuncia
   */
  renunciar(postulante: PostulanteConEstado) {
    if (confirm(`¿Está seguro de registrar la RENUNCIA de ${postulante.apellidos_nombres}?`)) {
      this.apiService.renunciar(postulante.id, { 
        postulanteId: postulante.id,
        observaciones: 'Renuncia registrada desde frontend' 
      }).subscribe({
        next: (response) => {
          this.mostrarExito('Renuncia registrada exitosamente');
          this.cargarPostulantes();
          this.cargarPlazas(); // Actualizar disponibilidad
        },
        error: (error) => {
          console.error('Error al renunciar:', error);
          this.mostrarError('Error al registrar renuncia');
        }
      });
    }
  }

  /**
   * Obtener clase CSS para badge de estado
   */
  getBadgeClass(estado: EstadoAdjudicacion): string {
    switch (estado) {
      case 'pendiente': return 'warning';
      case 'adjudicado': return 'success';
      case 'desistido': return 'error';
      case 'renuncio': return 'info';
      default: return 'info';
    }
  }

  /**
   * Obtener texto legible del estado
   */
  getEstadoTexto(estado: EstadoAdjudicacion): string {
    switch (estado) {
      case 'pendiente': return 'Pendiente';
      case 'adjudicado': return 'Adjudicado';
      case 'desistido': return 'Desistido';
      case 'renuncio': return 'Renunció';
      default: return 'Desconocido';
    }
  }

  /**
   * Mostrar mensaje de éxito
   */
  mostrarExito(mensaje: string) {
    this.snackBar.open(mensaje, 'Cerrar', {
      duration: 3000,
      panelClass: ['success-snackbar']
    });
  }

  /**
   * Mostrar mensaje de error
   */
  mostrarError(mensaje: string) {
    this.snackBar.open(mensaje, 'Cerrar', {
      duration: 5000,
      panelClass: ['error-snackbar']
    });
  }

  /**
   * Mostrar mensaje informativo
   */
  mostrarInfo(mensaje: string) {
    this.snackBar.open(mensaje, 'Cerrar', {
      duration: 3000,
      panelClass: ['info-snackbar']
    });
  }
}