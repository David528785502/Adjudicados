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
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';

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
      <!-- Filtros Globales -->
      <div class="global-filters">
        <h3 class="filters-title">
          <mat-icon>filter_list</mat-icon>
          Filtros Generales
        </h3>
        <div class="filters-row">
          <mat-form-field appearance="outline">
            <mat-label>Grupo Ocupacional</mat-label>
            <mat-select [(value)]="filtroGlobal.grupoOcupacionalId" 
                       (selectionChange)="aplicarFiltrosGlobales()">
              <mat-option [value]="undefined">Todos</mat-option>
              <mat-option *ngFor="let grupo of gruposOcupacionales" [value]="grupo.id">
                {{grupo.nombre}}
              </mat-option>
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Subunidad</mat-label>
            <mat-select [(value)]="filtroGlobal.subunidades" 
                       (selectionChange)="aplicarFiltrosGlobales()"
                       multiple>
              <mat-option [value]="undefined" (click)="limpiarSubunidades()">Todas</mat-option>
              <mat-option *ngFor="let subunidad of subunidadesDisponibles" [value]="subunidad">
                {{subunidad}}
              </mat-option>
            </mat-select>
          </mat-form-field>

          <div class="fecha-filter-wrapper" (click)="$event.stopPropagation()">
            <mat-form-field appearance="outline" (click)="toggleCalendario()">
              <mat-label>Fecha de Registro</mat-label>
              <input matInput 
                     [value]="filtroGlobal.fechaRegistro ? formatearFecha(filtroGlobal.fechaRegistro) : 'Todas'"
                     readonly
                     style="cursor: pointer;">
              <mat-icon matSuffix>calendar_today</mat-icon>
            </mat-form-field>
            
            <!-- Calendario personalizado -->
            <div class="calendario-popup" *ngIf="mostrarCalendario" (click)="$event.stopPropagation()">
              <div class="calendario-header">
                <button mat-icon-button (click)="cambiarMes(-1)">
                  <mat-icon>chevron_left</mat-icon>
                </button>
                <span class="calendario-mes">{{obtenerNombreMes()}} {{anioActualCalendario}}</span>
                <button mat-icon-button (click)="cambiarMes(1)">
                  <mat-icon>chevron_right</mat-icon>
                </button>
              </div>
              <div class="calendario-dias-semana">
                <div class="dia-semana">D</div>
                <div class="dia-semana">L</div>
                <div class="dia-semana">M</div>
                <div class="dia-semana">M</div>
                <div class="dia-semana">J</div>
                <div class="dia-semana">V</div>
                <div class="dia-semana">S</div>
              </div>
              <div class="calendario-dias">
                <div *ngFor="let dia of diasDelMes" 
                     class="dia"
                     [class.vacio]="!dia.numero"
                     [class.disponible]="dia.disponible"
                     [class.seleccionado]="dia.seleccionado"
                     [class.hoy]="dia.hoy"
                     (click)="seleccionarDia(dia)">
                  {{dia.numero}}
                </div>
              </div>
              <div class="calendario-footer">
                <button mat-button (click)="limpiarFechaCalendario()">
                  <mat-icon>clear</mat-icon>
                  Todas
                </button>
              </div>
            </div>
          </div>

          <mat-form-field appearance="outline">
            <mat-label>Estado</mat-label>
            <mat-select [(value)]="filtroGlobal.estado" 
                       (selectionChange)="aplicarFiltrosGlobales()">
              <mat-option [value]="undefined">Todos</mat-option>
              <mat-option value="pendiente">Pendiente</mat-option>
              <mat-option value="adjudicado">Adjudicado</mat-option>
              <mat-option value="desistido">Desistido</mat-option>
              <mat-option value="renuncio">Renunció</mat-option>
              <mat-option value="ausente">Ausente</mat-option>
            </mat-select>
          </mat-form-field>

          <button mat-raised-button color="primary" (click)="limpiarFiltros()">
            <mat-icon>clear</mat-icon>
            Limpiar Filtros
          </button>

          <div class="upload-section">
            <input type="file" 
                   #fileInput 
                   accept=".xlsx,.xls" 
                   style="display: none;"
                   (change)="onFileSelected($event)">
            <button mat-raised-button 
                    color="accent" 
                    class="upload-button"
                    (click)="fileInput.click()"
                    [disabled]="uploadingFile">
              <mat-icon>upload_file</mat-icon>
              <span *ngIf="!uploadingFile">Subir Excel</span>
              <span *ngIf="uploadingFile">Subiendo...</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Contenedor de las 2 tablas -->
      <div class="tables-container">
        
        <!-- TABLA IZQUIERDA: Postulantes -->
        <div class="table-section">
          <h2 class="section-title">
            <mat-icon>people</mat-icon>
            Postulantes ({{postulantes.length}})
          </h2>

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

              <!-- Columna Estado -->
              <ng-container matColumnDef="estado">
                <th mat-header-cell *matHeaderCellDef>Estado</th>
                <td mat-cell *matCellDef="let postulante">
                  <span [class]="'badge badge-' + getBadgeClass(postulante.estado)">
                    {{getEstadoTexto(postulante.estado)}}
                  </span>
                </td>
              </ng-container>

              <!-- Columna Grupo Ocupacional -->
              <ng-container matColumnDef="grupo_ocupacional">
                <th mat-header-cell *matHeaderCellDef>Grupo Ocupacional</th>
                <td mat-cell *matCellDef="let postulante" class="grupo-ocupacional-cell">
                  <div class="grupo-ocupacional-content">
                    <div class="grupo-nombre">{{postulante.grupo_ocupacional || '-'}}</div>
                    <ng-container *ngIf="postulante.especialidad && postulante.especialidad.trim() !== ''">
                      <div class="grupo-separador">-</div>
                      <div class="grupo-especialidad">{{postulante.especialidad}}</div>
                    </ng-container>
                  </div>
                </td>
              </ng-container>

              <!-- Columna IPRESS Adjudicada -->
              <ng-container matColumnDef="ipress">
                <th mat-header-cell *matHeaderCellDef>IPRESS</th>
                <td mat-cell *matCellDef="let postulante">
                  {{postulante.estado === 'renuncio' ? '-' : (postulante.ipress_adjudicada || '-')}}
                </td>
              </ng-container>

              <!-- Columna Acciones -->
              <ng-container matColumnDef="acciones">
                <th mat-header-cell *matHeaderCellDef>Acciones</th>
                <td mat-cell *matCellDef="let postulante">
                  <div class="action-buttons">
                    <!-- Acciones para estado PENDIENTE -->
                    <ng-container *ngIf="postulante.estado === 'pendiente'">
                      <button mat-raised-button color="primary" 
                             [disabled]="loadingPostulantes"
                             (click)="adjudicar(postulante)">
                        <mat-icon>assignment</mat-icon>
                        Adjudicar
                      </button>
                      
                      <button mat-raised-button color="warn"
                             [disabled]="loadingPostulantes"
                             (click)="confirmarDesistir(postulante)">
                        <mat-icon>cancel</mat-icon>
                        Desistido
                      </button>
                      
                      <button mat-raised-button 
                             style="background-color: #ff9800; color: white;"
                             [disabled]="loadingPostulantes"
                             (click)="confirmarAusente(postulante)">
                        <mat-icon>person_off</mat-icon>
                        Ausente
                      </button>
                    </ng-container>
                    
                    <!-- Acciones para estado ADJUDICADO -->
                    <ng-container *ngIf="postulante.estado === 'adjudicado'">
                      <button mat-raised-button color="accent"
                             [disabled]="loadingPostulantes"
                             (click)="confirmarRenuncia(postulante)">
                        <mat-icon>exit_to_app</mat-icon>
                        Renunciar
                      </button>
                    </ng-container>
                    
                    <!-- Acciones para estados DESISTIDO, AUSENTE, RENUNCIO -->
                    <ng-container *ngIf="postulante.estado === 'desistido' || postulante.estado === 'ausente' || postulante.estado === 'renuncio'">
                      <button mat-raised-button 
                             style="background-color: #4caf50; color: white;"
                             [disabled]="loadingPostulantes"
                             (click)="confirmarReasignar(postulante)">
                        <mat-icon>replay</mat-icon>
                        Reasignar
                      </button>
                    </ng-container>
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

              <!-- Columna Subunidad -->
              <ng-container matColumnDef="subunidad">
                <th mat-header-cell *matHeaderCellDef>Subunidad</th>
                <td mat-cell *matCellDef="let plaza">{{plaza.subunidad || '-'}}</td>
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
              <tr mat-row *matRowDef="let row; columns: columnasPlazas;" 
                  [class.plaza-sin-disponibles]="row.libres === 0"></tr>
            </table>
          </div>

          <!-- Loading plazas -->
          <div *ngIf="loadingPlazas" class="loading-container">
            <mat-spinner diameter="50"></mat-spinner>
          </div>
        </div>
      </div>

      <!-- Botones de exportación -->
      <div class="export-buttons">
        <button mat-raised-button class="btn-pdf" (click)="generarPDFCredenciales()">
          <mat-icon>picture_as_pdf</mat-icon>
          Crear PDF
        </button>
        
        <button mat-raised-button class="btn-excel" (click)="exportarExcel()">
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
          <div class="postulante-info">
            <h3>Postulante Seleccionado</h3>
            <p><strong>Nombre:</strong> {{postulanteSeleccionado.apellidos_nombres}}</p>
            <p><strong>Orden de Mérito:</strong> {{postulanteSeleccionado.orden_merito}}</p>
            <p><strong>Grupo Ocupacional:</strong> {{postulanteSeleccionado.grupo_ocupacional}}</p>
          </div>

          <div class="plazas-disponibles">
            <div class="plazas-header">
              <div class="header-content">
                <h3>Plazas Disponibles</h3>
                <span class="plazas-count">{{plazasFiltradasModal.length}} de {{plazasDisponibles.length}} {{plazasFiltradasModal.length === 1 ? 'plaza' : 'plazas'}}</span>
              </div>
            </div>
            
            <div class="plazas-list">
              <!-- Lista de plazas filtradas -->
              <div 
                *ngFor="let plaza of plazasFiltradasModal" 
                class="plaza-item"
                [class.selected]="plazaSeleccionada?.id === plaza.id"
                (click)="seleccionarPlaza(plaza)">
                
                <div class="plaza-content">
                  <div class="plaza-primary">
                      <div class="plaza-red">
                        <mat-icon class="location-icon">location_on</mat-icon>
                        <span class="red-name">{{plaza.red}}</span>
                      </div>
                    <div class="plaza-libres">
                      <span class="libres-number">{{plaza.libres}}</span>
                      <span class="libres-text">{{plaza.libres === 1 ? 'libre' : 'libres'}}</span>
                    </div>
                  </div>
                  
                  <div class="plaza-secondary">
                    <div class="ipress-name">{{plaza.ipress}}</div>
                    <div class="plaza-meta">
                      <span *ngIf="plaza.subunidad" class="meta-item">{{plaza.subunidad}}</span>
                      <span *ngIf="plaza.especialidad" class="meta-item">{{plaza.especialidad}}</span>
                    </div>
                  </div>
                  
                  <div class="plaza-stats">
                    <div class="stat-item">
                      <span class="stat-label">Total:</span>
                      <span class="stat-value">{{plaza.total}}</span>
                    </div>
                    <div class="stat-item">
                      <span class="stat-label">Asignados:</span>
                      <span class="stat-value">{{plaza.asignados}}</span>
                    </div>
                    <div class="stat-item">
                      <span class="stat-label">Libres:</span>
                      <span class="stat-value highlight">{{plaza.libres}}</span>
                    </div>
                  </div>
                </div>

                <div class="plaza-selector">
                  <mat-icon *ngIf="plazaSeleccionada?.id === plaza.id" class="selected-icon">check_circle</mat-icon>
                  <mat-icon *ngIf="plazaSeleccionada?.id !== plaza.id" class="unselected-icon">radio_button_unchecked</mat-icon>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button 
            mat-stroked-button 
            class="cancel-button"
            (click)="cerrarModalAdjudicacion()">
            <mat-icon>close</mat-icon>
            Cancelar
          </button>
          <button 
            mat-raised-button 
            color="primary"
            class="confirm-button"
            [disabled]="!plazaSeleccionada || loadingPostulantes"
            (click)="confirmarAdjudicacionFinal()">
            <mat-icon>check_circle</mat-icon>
            <span *ngIf="!loadingPostulantes">Confirmar Adjudicación</span>
            <span *ngIf="loadingPostulantes">Adjudicando...</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Modal de Confirmación -->
    <div class="modal-backdrop" *ngIf="mostrarModalConfirmacion">
      <div class="modal-content confirmation-modal" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h2>Confirmar Acción</h2>
        </div>

        <div class="modal-body">
          <div class="confirmation-message">
            <mat-icon class="warning-icon" [class.warning]="iconoConfirmacion === 'warning'">{{iconoConfirmacion}}</mat-icon>
            <div class="message-content">
              <pre>{{mensajeConfirmacion}}</pre>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button 
            *ngIf="iconoConfirmacion !== 'warning'"
            mat-stroked-button 
            class="cancel-button"
            (click)="cancelarAccion()">
            <mat-icon>close</mat-icon>
            Cancelar
          </button>
          <button 
            mat-raised-button 
            color="primary"
            class="confirm-button"
            (click)="confirmarAccion()">
            <mat-icon>check_circle</mat-icon>
            Aceptar
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
      background-color: rgba(0, 0, 0, 0.6);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1000;
      backdrop-filter: blur(2px);
    }

    .modal-content {
      background: white;
      border-radius: 12px;
      max-width: 900px;
      max-height: 85vh;
      width: 90%;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 24px 28px;
      border-bottom: 2px solid #e3f2fd;
      background: linear-gradient(135deg, #1976d2 0%, #1565c0 100%);
    }

    .modal-header h2 {
      margin: 0;
      color: white;
      font-size: 22px;
      font-weight: 500;
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .modal-header button {
      color: white !important;
    }

    .modal-body {
      padding: 20px;
      flex: 1;
      overflow-y: auto;
      background-color: #fafafa;
    }

    .postulante-info {
      background-color: #e3f2fd;
      padding: 12px 16px;
      border-radius: 4px;
      margin-bottom: 16px;
      border-left: 3px solid #1976d2;
    }

    .postulante-info h3 {
      margin: 0 0 8px 0;
      color: #1565c0;
      font-size: 14px;
      font-weight: 600;
    }

    .postulante-info p {
      margin: 5px 0;
      color: #424242;
      font-size: 13px;
    }

    .postulante-info strong {
      color: #1976d2;
      font-weight: 600;
    }

    .plazas-disponibles {
      background: white;
      border-radius: 6px;
      padding: 16px;
    }

    .plazas-header {
      margin-bottom: 12px;
      padding-bottom: 10px;
      border-bottom: 1px solid #e0e0e0;
    }

    .plazas-header .header-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .plazas-header h3 {
      margin: 0;
      color: #1976d2;
      font-size: 16px;
      font-weight: 600;
    }

    .plazas-header .plazas-count {
      background-color: #ff9800;
      color: white;
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
    }

    .plazas-list {
      max-height: 450px;
      overflow-y: auto;
    }

    .plaza-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 12px;
      margin-bottom: 8px;
      border: 1px solid #e0e0e0;
      border-radius: 4px;
      cursor: pointer;
      transition: all 0.2s ease;
      background: white;
    }

    .plaza-item:hover {
      border-color: #1976d2;
      background-color: #f5f5f5;
    }

    .plaza-item.selected {
      background-color: #e3f2fd;
      border-color: #1976d2;
      border-width: 2px;
    }

    .plaza-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .plaza-primary {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
    }

    .plaza-red {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .location-icon {
      color: #1976d2;
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    .red-name {
      color: #1976d2;
      font-size: 13px;
      font-weight: 600;
    }

    .plaza-libres {
      display: flex;
      align-items: center;
      gap: 4px;
      background-color: #4caf50;
      padding: 4px 10px;
      border-radius: 12px;
    }

    .libres-number {
      color: white;
      font-size: 15px;
      font-weight: 600;
    }

    .libres-text {
      color: white;
      font-size: 11px;
      font-weight: 500;
    }

    .plaza-secondary {
      display: flex;
      flex-direction: column;
      gap: 3px;
    }

    .ipress-name {
      color: #212121;
      font-size: 13px;
      font-weight: 600;
      line-height: 1.3;
    }

    .plaza-meta {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }

    .meta-item {
      color: #666;
      font-size: 12px;
      padding: 2px 6px;
      background-color: #f5f5f5;
      border-radius: 3px;
    }

    .plaza-stats {
      display: flex;
      gap: 12px;
      padding-top: 6px;
      margin-top: 4px;
      border-top: 1px solid #e0e0e0;
    }

    .stat-item {
      display: flex;
      align-items: center;
      gap: 3px;
    }

    .stat-label {
      color: #757575;
      font-size: 11px;
    }

    .stat-value {
      color: #424242;
      font-size: 11px;
      font-weight: 600;
    }

    .stat-value.highlight {
      color: #4caf50;
    }

    .plaza-selector {
      display: flex;
      align-items: center;
      padding-left: 12px;
    }

    .selected-icon {
      color: #1976d2;
      font-size: 24px;
      width: 24px;
      height: 24px;
    }

    .unselected-icon {
      color: #bdbdbd;
      font-size: 24px;
      width: 24px;
      height: 24px;
    }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      padding: 20px 28px;
      border-top: 2px solid #e3f2fd;
      background-color: #fafafa;
    }

    .cancel-button {
      color: #d32f2f !important;
      border-color: #d32f2f !important;
      font-weight: 500;
      padding: 0 24px;
    }

    .cancel-button:hover {
      background-color: #ffebee !important;
    }

    .confirm-button {
      font-weight: 500;
      padding: 0 24px;
      box-shadow: 0 2px 8px rgba(25, 118, 210, 0.3);
    }

    .confirm-button:hover:not([disabled]) {
      box-shadow: 0 4px 12px rgba(25, 118, 210, 0.4);
      transform: translateY(-1px);
    }

    /* Modal de Confirmación */
    .confirmation-modal {
      max-width: 600px;
    }

    .confirmation-message {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 24px;
      padding: 32px 24px;
    }

    .warning-icon {
      font-size: 72px;
      width: 72px;
      height: 72px;
      color: #1976d2;
    }

    .warning-icon.warning {
      color: #ff9800 !important;
    }

    .message-content {
      width: 100%;
      background: #f5f5f5;
      border-radius: 8px;
      padding: 24px;
      border-left: 4px solid #1976d2;
    }

    .confirmation-message pre {
      white-space: pre-wrap;
      font-family: 'Roboto', sans-serif;
      font-size: 14px;
      line-height: 1.8;
      color: #424242;
      margin: 0;
      font-weight: 400;
    }

    /* Filtros Globales */
    .global-filters {
      background: white;
      padding: 20px 24px;
      margin-bottom: 10px;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }

    .filters-title {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 0 0 16px 0;
      color: #1976d2;
      font-size: 18px;
      font-weight: 500;
    }

    .filters-title mat-icon {
      color: #1976d2;
    }

    .filters-row {
      display: flex;
      gap: 10px;
      align-items: flex-end;
      flex-wrap: wrap;
      justify-content: flex-start;
    }

    .filters-row mat-form-field {
      flex: 1 1 auto;
      min-width: 140px;
      max-width: 220px;
    }

    .filters-row > button {
      height: 56px;
      margin-bottom: 22px;
      flex-shrink: 0;
      padding: 0 20px;
    }

    /* Upload Section */
    .upload-section {
      display: flex;
      align-items: flex-end;
      flex-shrink: 0;
    }

    .upload-button {
      height: 56px;
      margin-bottom: 22px;
      background-color: #4caf50 !important;
      color: white !important;
      font-weight: 500;
      padding: 0 20px;
      box-shadow: 0 2px 8px rgba(76, 175, 80, 0.3);
      white-space: nowrap;
    }

    .upload-button:hover {
      background-color: #45a049 !important;
      box-shadow: 0 4px 12px rgba(76, 175, 80, 0.4);
    }

    .upload-button mat-icon {
      margin-right: 8px;
    }

    /* Calendario personalizado */
    .fecha-filter-wrapper {
      flex: 0.8 1 auto;
      min-width: 130px;
      max-width: 200px;
      position: relative;
    }

    .fecha-filter-wrapper mat-form-field {
      cursor: pointer;
      width: 100%;
    }

    .fecha-filter-wrapper input {
      cursor: pointer !important;
      user-select: none;
    }

    .calendario-popup {
      position: absolute;
      top: 80%;
      left: 0;
      margin-top: 100 px;
      background: white;
      border-radius: 8px;
      box-shadow: 0 4px 16px rgba(0,0,0,0.2);
      padding: 12 px;
      padding-bottom: -100px;
      z-index: 1000;
      min-width: 320px;
    }

    .calendario-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0px;
    }

    .calendario-mes {
      font-weight: 600;
      font-size: 16px;
      color: #1976d2;
    }

    .calendario-dias-semana {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      gap: 4px;
      margin-bottom: 8px;
    }

    .dia-semana {
      text-align: center;
      font-weight: 600;
      font-size: 12px;
      color: #666;
      padding: 8px 0;
    }

    .calendario-dias {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      gap: 4px;
    }

    .dia {
      aspect-ratio: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      font-size: 14px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .dia.vacio {
      cursor: default;
    }

    .dia.disponible {
      color: #1976d2;
      font-weight: 500;
    }

    .dia.disponible:hover {
      background-color: #e3f2fd;
    }

    .dia.seleccionado {
      background-color: #1976d2;
      color: white;
      font-weight: 600;
    }

    .dia.hoy {
      border: 2px solid #1976d2;
    }

    .dia:not(.disponible):not(.vacio) {
      color: #ccc;
      cursor: not-allowed;
    }

    .calendario-footer {
      margin-top: 8px;
      padding-top: 8px;
      border-top: 1px solid #e0e0e0;
      display: flex;
      justify-content: center;
    }

    .calendario-footer button {
      padding-top: 0;
      padding-bottom: 0;
      margin-top: 0;
      margin-bottom: 0;
    }

    /* Columna Grupo Ocupacional con Especialidad */
    .grupo-ocupacional-cell {
      text-align: center;
    }

    .grupo-ocupacional-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 2px;
    }

    .grupo-nombre {
      font-weight: 500;
      color: #212121;
      font-size: 13px;
      line-height: 1.3;
    }

    .grupo-separador {
      color: #9e9e9e;
      font-size: 12px;
      font-weight: 400;
    }

    .grupo-especialidad {
      color: #1976d2;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
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
  uploadingFile = false;

  // Columnas de las tablas
  columnasPostulantes: string[] = ['orden', 'nombres', 'estado', 'grupo_ocupacional', 'ipress', 'acciones'];
  columnasPlazas: string[] = ['red', 'ipress', 'subunidad', 'total', 'asignados', 'libres'];

  // Filtros
  filtroPostulantes: FiltroPostulantes = {};
  filtroPlazas: FiltroPlazas = {};
  
  // Filtro global
  filtroGlobal: {
    grupoOcupacionalId?: number;
    fechaRegistro?: string;
    estado?: EstadoAdjudicacion;
    subunidades?: string[];
  } = {};
  fechasDisponibles: string[] = [];
  subunidadesDisponibles: string[] = [];
  postulantesSinFiltrar: PostulanteConEstado[] = [];
  plazasSinFiltrar: PlazaConDisponibilidad[] = [];

  // Calendario personalizado
  mostrarCalendario = false;
  mesActualCalendario: number = new Date().getMonth();
  anioActualCalendario: number = new Date().getFullYear();
  diasDelMes: Array<{numero: number | null, disponible: boolean, seleccionado: boolean, hoy: boolean, fecha?: string}> = [];

  // Modal de adjudicación
  mostrarModalAdjudicacion = false;
  postulanteSeleccionado: PostulanteConEstado | null = null;
  plazasDisponibles: PlazaConDisponibilidad[] = [];
  plazasFiltradasModal: PlazaConDisponibilidad[] = [];
  plazaSeleccionada: PlazaConDisponibilidad | null = null;

  // Modal de confirmación
  mostrarModalConfirmacion = false;
  mensajeConfirmacion = '';
  iconoConfirmacion = 'info';
  accionConfirmacion: (() => void) | null = null;

  private apiService = inject(ApiService);
  private snackBar = inject(MatSnackBar);

  ngOnInit() {
    this.cargarDatos();
    
    // Listener para cerrar calendario al hacer clic fuera
    document.addEventListener('click', (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const clickedInsideCalendar = target.closest('.fecha-filter-wrapper');
      
      if (this.mostrarCalendario && !clickedInsideCalendar) {
        setTimeout(() => {
          this.mostrarCalendario = false;
        }, 0);
      }
    });
  }

  /**
   * Cargar todos los datos iniciales
   */
  async cargarDatos() {
    try {
      // Cargar datos de referencia primero
      await this.cargarGruposOcupacionalesAsync();
      await this.cargarRedesAsync();
      
      // Cargar datos principales
      await this.cargarPostulantesAsync();
      
      // Finalmente cargar plazas
      this.cargarPlazas();
    } catch (error) {
      console.error('Error durante la carga inicial:', error);
    }
  }

  /**
   * Cargar postulantes con estado (versión async)
   */
  cargarPostulantesAsync(): Promise<void> {
    return new Promise((resolve) => {
      this.cargarPostulantes();
      // Esperar un poco para que la petición se inicie
      setTimeout(() => resolve(), 100);
    });
  }

  /**
   * Cargar grupos ocupacionales (versión async)
   */
  cargarGruposOcupacionalesAsync(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.apiService.getGruposOcupacionales().subscribe({
        next: (response) => {
          this.gruposOcupacionales = response.data;
          resolve();
        },
        error: (error) => {
          console.error('Error al cargar grupos ocupacionales:', error);
          resolve(); // No rechazar, continuar con la carga
        }
      });
    });
  }

  /**
   * Cargar redes (versión async)
   */
  cargarRedesAsync(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.apiService.getRedes().subscribe({
        next: (response) => {
          this.redes = response.data;
          resolve();
        },
        error: (error) => {
          console.error('Error al cargar redes:', error);
          resolve(); // No rechazar, continuar con la carga
        }
      });
    });
  }

  /**
   * Cargar postulantes con estado
   */
  cargarPostulantes() {
    this.loadingPostulantes = true;
    this.apiService.getPostulantesConEstado().subscribe({
      next: (response: any) => {
        const data = (response.data || response || []).slice().sort((a: any, b: any) => {
          // Orden de prioridad de estados
          const ordenEstado: { [key: string]: number } = {
            'pendiente': 1,
            'adjudicado': 2,
            'renuncio': 3,
            'desistido': 4,
            'ausente': 5
          };
          
          const estadoA = ordenEstado[a.estado] || 999;
          const estadoB = ordenEstado[b.estado] || 999;
          
          // Primero ordenar por estado
          if (estadoA !== estadoB) {
            return estadoA - estadoB;
          }
          
          // Luego por orden de mérito
          return (a.orden_merito || 0) - (b.orden_merito || 0);
        });
        
        // Guardar copia sin filtrar
        this.postulantesSinFiltrar = [...data];
        this.postulantes = data;
        
        // Extraer fechas únicas de registro
        this.extraerFechasDisponibles();
        
        this.loadingPostulantes = false;
      },
      error: (error: any) => {
        
        let errorMsg = 'Error al cargar postulantes';
        if (error.status === 0) {
          errorMsg = 'No se pudo conectar con el servidor. Esta el backend ejecutandose en http://localhost:3000?';
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
        let data = response.data || response || [];
        // Ordenar: plazas con libres > 0 primero, luego las que tienen 0
        data = data.sort((a: any, b: any) => {
          if (a.libres === 0 && b.libres > 0) return 1;
          if (a.libres > 0 && b.libres === 0) return -1;
          return 0;
        });
        // Guardar copia sin filtrar
        this.plazasSinFiltrar = [...data];
        this.plazas = data;
        
        // Extraer subunidades únicas disponibles
        this.extraerSubunidadesDisponibles();
        
        this.loadingPlazas = false;
      },
      error: (error: any) => {
        
        let errorMsg = 'Error al cargar plazas';
        if (error.status === 0) {
          errorMsg = 'No se pudo conectar con el servidor. Esta el backend ejecutandose en http://localhost:3000?';
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
        this.postulantes = (response.data || []).slice().sort((a: any, b: any) => {
          // Orden de prioridad de estados
          const ordenEstado: { [key: string]: number } = {
            'pendiente': 1,
            'adjudicado': 2,
            'renuncio': 3,
            'desistido': 4,
            'ausente': 5
          };
          
          const estadoA = ordenEstado[a.estado] || 999;
          const estadoB = ordenEstado[b.estado] || 999;
          
          // Primero ordenar por estado
          if (estadoA !== estadoB) {
            return estadoA - estadoB;
          }
          
          // Luego por orden de mérito
          return (a.orden_merito || 0) - (b.orden_merito || 0);
        });
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

    this.apiService.getPlazasConDisponibilidad(filtros).subscribe({
      next: (response: any) => {
        this.plazas = response.data || [];
        this.loadingPlazas = false;
      },
      error: (error: any) => {
        this.mostrarError(`Error al filtrar plazas: ${error.status || 'desconocido'}`);
        this.loadingPlazas = false;
      }
    });
  }

  /**
   * Extraer subunidades únicas de plazas
   */
  extraerSubunidadesDisponibles() {
    const subunidadesSet = new Set<string>();
    this.plazasSinFiltrar.forEach(p => {
      const subunidad = p.subunidad || '-';
      subunidadesSet.add(subunidad);
    });
    this.subunidadesDisponibles = Array.from(subunidadesSet).sort();
  }

  /**
   * Extraer fechas únicas de registro de postulantes
   */
  extraerFechasDisponibles() {
    const fechasSet = new Set<string>();
    this.postulantesSinFiltrar.forEach(p => {
      if (p.fecha_registro) {
        // Convertir la fecha a formato YYYY-MM-DD
        const fecha = new Date(p.fecha_registro);
        const fechaStr = fecha.toISOString().split('T')[0];
        fechasSet.add(fechaStr);
      }
    });
    this.fechasDisponibles = Array.from(fechasSet).sort().reverse(); // Más recientes primero
  }

  /**
   * Formatear fecha para mostrar en el select
   */
  formatearFecha(fechaStr: string): string {
    const fecha = new Date(fechaStr + 'T00:00:00');
    const opciones: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return fecha.toLocaleDateString('es-ES', opciones);
  }

  /**
   * Toggle mostrar/ocultar calendario
   */
  toggleCalendario() {
    this.mostrarCalendario = !this.mostrarCalendario;
    if (this.mostrarCalendario) {
      this.generarDiasDelMes();
    }
  }

  /**
   * Obtener nombre del mes actual
   */
  obtenerNombreMes(): string {
    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                   'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    return meses[this.mesActualCalendario];
  }

  /**
   * Cambiar mes del calendario
   */
  cambiarMes(direccion: number) {
    this.mesActualCalendario += direccion;
    if (this.mesActualCalendario > 11) {
      this.mesActualCalendario = 0;
      this.anioActualCalendario++;
    } else if (this.mesActualCalendario < 0) {
      this.mesActualCalendario = 11;
      this.anioActualCalendario--;
    }
    this.generarDiasDelMes();
  }

  /**
   * Generar array de días para el mes actual
   */
  generarDiasDelMes() {
    this.diasDelMes = [];
    const primerDia = new Date(this.anioActualCalendario, this.mesActualCalendario, 1);
    const ultimoDia = new Date(this.anioActualCalendario, this.mesActualCalendario + 1, 0);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    
    // Días vacíos al inicio
    for (let i = 0; i < primerDia.getDay(); i++) {
      this.diasDelMes.push({ numero: null, disponible: false, seleccionado: false, hoy: false });
    }
    
    // Días del mes
    for (let dia = 1; dia <= ultimoDia.getDate(); dia++) {
      const fecha = new Date(this.anioActualCalendario, this.mesActualCalendario, dia);
      const fechaStr = fecha.toISOString().split('T')[0];
      const disponible = this.fechasDisponibles.includes(fechaStr);
      const seleccionado = this.filtroGlobal.fechaRegistro === fechaStr;
      
      fecha.setHours(0, 0, 0, 0);
      const esHoy = fecha.getTime() === hoy.getTime();
      
      this.diasDelMes.push({
        numero: dia,
        disponible,
        seleccionado,
        hoy: esHoy,
        fecha: fechaStr
      });
    }
  }

  /**
   * Seleccionar un día del calendario
   */
  seleccionarDia(dia: any) {
    if (!dia.disponible || !dia.numero) return;
    
    this.filtroGlobal.fechaRegistro = dia.fecha;
    this.aplicarFiltrosGlobales();
    this.mostrarCalendario = false;
  }

  /**
   * Limpiar filtro de fecha desde el calendario
   */
  limpiarFechaCalendario() {
    this.filtroGlobal.fechaRegistro = undefined;
    this.aplicarFiltrosGlobales();
    this.mostrarCalendario = false;
  }

  /**
   * Aplicar filtros globales a ambas tablas
   */
  aplicarFiltrosGlobales() {
    // Filtrar postulantes (solo grupo ocupacional, fecha y estado)
    let postulantesFiltrados = [...this.postulantesSinFiltrar];
    
    if (this.filtroGlobal.grupoOcupacionalId) {
      postulantesFiltrados = postulantesFiltrados.filter(p => 
        p.grupo_ocupacional_id === this.filtroGlobal.grupoOcupacionalId
      );
    }
    
    if (this.filtroGlobal.estado) {
      postulantesFiltrados = postulantesFiltrados.filter(p => 
        p.estado === this.filtroGlobal.estado
      );
    }
    
    if (this.filtroGlobal.fechaRegistro) {
      postulantesFiltrados = postulantesFiltrados.filter(p => {
        if (!p.fecha_registro) return false;
        const fecha = new Date(p.fecha_registro);
        const fechaStr = fecha.toISOString().split('T')[0];
        return fechaStr === this.filtroGlobal.fechaRegistro;
      });
    }
    
    this.postulantes = postulantesFiltrados;
    
    // Filtrar plazas (solo subunidades)
    let plazasFiltradas = [...this.plazasSinFiltrar];
    
    if (this.filtroGlobal.subunidades && this.filtroGlobal.subunidades.length > 0) {
      // Filtrar si subunidades no incluye undefined (que representa "Todas")
      const subunidadesValidas = this.filtroGlobal.subunidades.filter(s => s !== undefined);
      if (subunidadesValidas.length > 0) {
        plazasFiltradas = plazasFiltradas.filter(p => 
          subunidadesValidas.includes(p.subunidad || '-')
        );
      }
    }
    
    this.plazas = plazasFiltradas;
  }

  /**
   * Limpiar todos los filtros
   */
  limpiarFiltros() {
    this.filtroGlobal = {};
    this.postulantes = [...this.postulantesSinFiltrar];
    this.plazas = [...this.plazasSinFiltrar];
  }

  /**
   * Limpiar filtro de subunidades
   */
  limpiarSubunidades() {
    this.filtroGlobal.subunidades = [];
    this.aplicarFiltrosGlobales();
  }

  /**
   * Adjudicar postulante - mostrar plazas disponibles para selección
   */
  adjudicar(postulante: PostulanteConEstado) {
    // Validar que el postulante puede ser adjudicado
    if (postulante.estado !== 'pendiente') {
      this.mostrarError(`No se puede adjudicar: el postulante ya está en estado "${postulante.estado}"`);
      return;
    }
    
    // Guardar el postulante seleccionado
    this.postulanteSeleccionado = postulante;
    
    // Buscar plazas disponibles (sin filtrar por grupo ocupacional)
    const filtros: FiltroPlazas = { 
      soloDisponibles: true // Solo mostrar plazas con cupos libres
    };
    
    this.apiService.getPlazasConDisponibilidad(filtros).subscribe({
      next: (response) => {
        if (response.success && response.data && response.data.length > 0) {
          let plazasDisponibles = response.data;
          
          // Aplicar filtro de subunidades si está activo
          if (this.filtroGlobal.subunidades && this.filtroGlobal.subunidades.length > 0) {
            const subunidadesValidas = this.filtroGlobal.subunidades.filter(s => s !== undefined);
            if (subunidadesValidas.length > 0) {
              plazasDisponibles = plazasDisponibles.filter((p: any) => 
                subunidadesValidas.includes(p.subunidad || '-')
              );
            }
          }
          
          // Verificar si hay plazas después del filtro
          if (plazasDisponibles.length === 0) {
            this.mostrarError(`No hay plazas disponibles que coincidan con los filtros de subunidad seleccionados`);
            return;
          }
          
          this.plazasDisponibles = plazasDisponibles;
          this.plazasFiltradasModal = [...plazasDisponibles];
          this.plazaSeleccionada = null; // Resetear selección
          
          this.mostrarModalAdjudicacion = true; // Mostrar modal
        } else {
          this.mostrarError(`No hay plazas disponibles en este momento`);
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
  confirmarAdjudicacionFinal() {
    if (!this.postulanteSeleccionado || !this.plazaSeleccionada) {
      this.mostrarError('Debe seleccionar una plaza');
      return;
    }

    // Mostrar confirmación con los datos
    this.mensajeConfirmacion = 
      `POSTULANTE\n` +
      `${this.postulanteSeleccionado.apellidos_nombres}\n` +
      `Orden de Mérito: ${this.postulanteSeleccionado.orden_merito}\n` +
      `Grupo Ocupacional: ${this.postulanteSeleccionado.grupo_ocupacional}\n\n` +
      `PLAZA ASIGNADA\n` +
      `Red: ${this.plazaSeleccionada.red}\n` +
      `IPRESS: ${this.plazaSeleccionada.ipress}\n` +
      `Subunidad: ${this.plazaSeleccionada.subunidad || 'No especificada'}\n` +
      `Especialidad: ${this.plazaSeleccionada.especialidad || 'No especificada'}`;
    
    this.iconoConfirmacion = 'assignment_turned_in';
    this.accionConfirmacion = () => this.ejecutarAdjudicacion();
    this.mostrarModalConfirmacion = true;
  }

  /**
   * Ejecutar la adjudicación después de confirmar
   */
  ejecutarAdjudicacion() {
    if (!this.postulanteSeleccionado || !this.plazaSeleccionada) return;

    this.loadingPostulantes = true;
    this.loadingPlazas = true;
    
    // Guardar información de la plaza antes de la adjudicación
    const plazaAdjudicada = {
      id: this.plazaSeleccionada.id,
      red: this.plazaSeleccionada.red,
      ipress: this.plazaSeleccionada.ipress,
      subunidad: this.plazaSeleccionada.subunidad,
      libresAntes: this.plazaSeleccionada.libres
    };
    
    const adjudicacionData: RequestAdjudicar = {
      postulanteId: this.postulanteSeleccionado.id,
      plazaId: this.plazaSeleccionada.id,
      observaciones: `Adjudicación manual - OM: ${this.postulanteSeleccionado.orden_merito} a ${this.plazaSeleccionada.red} - ${this.plazaSeleccionada.ipress}`
    };
    
    this.apiService.adjudicar(adjudicacionData).subscribe({
      next: (response) => {
        if (response.success) {
          this.mostrarExito(`${this.postulanteSeleccionado!.apellidos_nombres} adjudicado exitosamente a ${plazaAdjudicada.red} - ${plazaAdjudicada.ipress}`);
          
          // Cerrar modal
          this.cerrarModalAdjudicacion();
          
          // Verificar si la plaza se agotó (tenía solo 1 libre antes de esta adjudicación)
          if (plazaAdjudicada.libresAntes === 1) {
            // La plaza se acaba de agotar
            // Resetear los flags de carga antes de mostrar el modal
            this.loadingPostulantes = false;
            this.loadingPlazas = false;
            
            this.mensajeConfirmacion = 
              `PLAZA AGOTADA\n\n` +
              `La plaza ha sido completamente ocupada:\n\n` +
              `Red: ${plazaAdjudicada.red}\n` +
              `IPRESS: ${plazaAdjudicada.ipress}\n` +
              `Subunidad: ${plazaAdjudicada.subunidad || 'No especificada'}\n\n` +
              `Ya no quedan cupos disponibles en esta plaza.`;
            this.iconoConfirmacion = 'warning';
            this.accionConfirmacion = () => {
              // Solo recargar datos después de que el usuario acepte
              this.recargarDatos();
            };
            this.mostrarModalConfirmacion = true;
          } else {
            // Recargar datos inmediatamente si aún quedan cupos
            this.recargarDatos();
          }
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
  }

  /**
   * Seleccionar una plaza del modal
   */
  seleccionarPlaza(plaza: PlazaConDisponibilidad) {
    this.plazaSeleccionada = plaza;
  }



  /**
   * Recargar todos los datos (postulantes, plazas, etc.)
   */
  recargarDatos() {
    // Verificar si hay filtros globales activos
    const hayFiltrosGlobales = 
      this.filtroGlobal.grupoOcupacionalId || 
      this.filtroGlobal.estado || 
      this.filtroGlobal.fechaRegistro;
    
    // Recargar datos desde el backend
    this.loadingPostulantes = true;
    this.loadingPlazas = true;
    
    let postulantesLoaded = false;
    let plazasLoaded = false;
    
    const aplicarFiltrosSiAmbosListos = () => {
      if (postulantesLoaded && plazasLoaded && hayFiltrosGlobales) {
        // Asegurar que se apliquen los filtros una vez que ambos conjuntos de datos estén cargados
        setTimeout(() => {
          this.aplicarFiltrosGlobales();
        }, 0);
      }
    };
    
    this.apiService.getPostulantesConEstado().subscribe({
      next: (response: any) => {
        const data = (response.data || response || []).slice().sort((a: any, b: any) => {
          const ordenEstado: { [key: string]: number } = {
            'pendiente': 1,
            'adjudicado': 2,
            'renuncio': 3,
            'desistido': 4,
            'ausente': 5
          };
          
          const estadoA = ordenEstado[a.estado] || 999;
          const estadoB = ordenEstado[b.estado] || 999;
          
          if (estadoA !== estadoB) {
            return estadoA - estadoB;
          }
          
          return (a.orden_merito || 0) - (b.orden_merito || 0);
        });
        
        this.postulantesSinFiltrar = [...data];
        
        if (!hayFiltrosGlobales) {
          this.postulantes = data;
        }
        
        this.extraerFechasDisponibles();
        this.loadingPostulantes = false;
        postulantesLoaded = true;
        aplicarFiltrosSiAmbosListos();
      },
      error: (error: any) => {
        this.mostrarError('Error al recargar postulantes');
        this.loadingPostulantes = false;
        postulantesLoaded = true;
      }
    });
    
    this.apiService.getPlazasConDisponibilidad().subscribe({
      next: (response: any) => {
        let data = response.data || response || [];
        // Ordenar: plazas con libres > 0 primero, luego las que tienen 0
        data = data.sort((a: any, b: any) => {
          if (a.libres === 0 && b.libres > 0) return 1;
          if (a.libres > 0 && b.libres === 0) return -1;
          return 0;
        });
        this.plazasSinFiltrar = [...data];
        
        if (!hayFiltrosGlobales) {
          this.plazas = data;
        }
        
        // Extraer subunidades disponibles
        this.extraerSubunidadesDisponibles();
        
        this.loadingPlazas = false;
        plazasLoaded = true;
        aplicarFiltrosSiAmbosListos();
      },
      error: (error: any) => {
        this.mostrarError('Error al recargar plazas');
        this.loadingPlazas = false;
      }
    });
    
    // Recargar también los filtros (grupos ocupacionales y redes)
    this.cargarGruposOcupacionales();
    this.cargarRedes();
  }

  /**
   * Marcar como desistido
   */
  confirmarDesistir(postulante: PostulanteConEstado) {
    if (this.loadingPostulantes) return;
    
    this.mensajeConfirmacion = 
      `¿Marcar como DESISTIDO?\n\n` +
      `POSTULANTE\n` +
      `${postulante.apellidos_nombres}\n` +
      `Orden de Mérito: ${postulante.orden_merito}\n` +
      `Grupo Ocupacional: ${postulante.grupo_ocupacional}`;
    this.iconoConfirmacion = 'cancel';
    this.accionConfirmacion = () => this.desistir(postulante);
    this.mostrarModalConfirmacion = true;
  }

  desistir(postulante: PostulanteConEstado) {
    if (this.loadingPostulantes) return; // Evitar múltiples clicks
    
    this.loadingPostulantes = true;
    this.mostrarInfo('Marcando como desistido...');
    this.apiService.desistir(postulante.id, { 
      postulanteId: postulante.id,
      observaciones: 'Desistimiento registrado desde frontend' 
    }).subscribe({
      next: (response) => {
        this.mostrarExito('Postulante marcado como desistido');
        this.recargarDatos();
      },
      error: (error) => {
        console.error('Error al desistir:', error);
        this.mostrarError('Error al registrar desistimiento');
        this.loadingPostulantes = false;
      }
    });
  }

  /**
   * Marcar como renuncia
   */
  confirmarRenuncia(postulante: PostulanteConEstado) {
    if (this.loadingPostulantes) return;
    
    this.mensajeConfirmacion = 
      `¿Registrar RENUNCIA?\n\n` +
      `POSTULANTE\n` +
      `${postulante.apellidos_nombres}\n` +
      `Orden de Mérito: ${postulante.orden_merito}\n` +
      `Grupo Ocupacional: ${postulante.grupo_ocupacional}\n\n` +
      `IPRESS ADJUDICADA\n` +
      `${postulante.ipress_adjudicada || 'No especificada'}`;
    this.iconoConfirmacion = 'exit_to_app';
    this.accionConfirmacion = () => this.renunciar(postulante);
    this.mostrarModalConfirmacion = true;
  }

  renunciar(postulante: PostulanteConEstado) {
    if (this.loadingPostulantes) return; // Evitar múltiples clicks
    
    this.loadingPostulantes = true;
    this.mostrarInfo('Registrando renuncia...');
    this.apiService.renunciar(postulante.id, { 
      postulanteId: postulante.id,
      observaciones: 'Renuncia registrada desde frontend' 
    }).subscribe({
      next: (response) => {
        this.mostrarExito('Renuncia registrada exitosamente');
        this.recargarDatos();
      },
      error: (error) => {
        console.error('Error al renunciar:', error);
        this.mostrarError('Error al registrar renuncia');
        this.loadingPostulantes = false;
      }
    });
  }

  /**
   * Marcar como ausente
   */
  confirmarAusente(postulante: PostulanteConEstado) {
    if (this.loadingPostulantes) return;
    
    this.mensajeConfirmacion = 
      `¿Marcar como AUSENTE?\n\n` +
      `POSTULANTE\n` +
      `${postulante.apellidos_nombres}\n` +
      `Orden de Mérito: ${postulante.orden_merito}\n` +
      `Grupo Ocupacional: ${postulante.grupo_ocupacional}`;
    this.iconoConfirmacion = 'person_off';
    this.accionConfirmacion = () => this.marcarAusente(postulante);
    this.mostrarModalConfirmacion = true;
  }

  marcarAusente(postulante: PostulanteConEstado) {
    if (this.loadingPostulantes) return; // Evitar múltiples clicks
    
    this.loadingPostulantes = true;
    this.mostrarInfo('Marcando como ausente...');
    this.apiService.marcarAusente(postulante.id, { 
      postulanteId: postulante.id,
      observaciones: 'Ausente registrado desde frontend' 
    }).subscribe({
      next: (response) => {
        this.mostrarExito('Postulante marcado como ausente exitosamente');
        this.recargarDatos();
      },
      error: (error) => {
        console.error('Error al marcar ausente:', error);
        this.mostrarError('Error al registrar ausencia');
        this.loadingPostulantes = false;
      }
    });
  }

  /**
   * Confirmar acción del modal
   */
  confirmarAccion() {
    this.mostrarModalConfirmacion = false;
    if (this.accionConfirmacion) {
      this.accionConfirmacion();
      this.accionConfirmacion = null;
    }
  }

  /**
   * Cancelar acción del modal
   */
  cancelarAccion() {
    this.mostrarModalConfirmacion = false;
    this.mensajeConfirmacion = '';
    this.iconoConfirmacion = 'info';
    this.accionConfirmacion = null;
  }

  /**
   * Confirmar reasignación
   */
  confirmarReasignar(postulante: PostulanteConEstado) {
    if (this.loadingPostulantes) return;
    
    this.mensajeConfirmacion = 
      `¿Reasignar a PENDIENTE?\n\n` +
      `POSTULANTE\n` +
      `${postulante.apellidos_nombres}\n` +
      `Orden de Mérito: ${postulante.orden_merito}\n` +
      `Grupo Ocupacional: ${postulante.grupo_ocupacional}\n` +
      `Estado Actual: ${postulante.estado.toUpperCase()}`;
    this.iconoConfirmacion = 'replay';
    this.accionConfirmacion = () => this.reasignar(postulante);
    this.mostrarModalConfirmacion = true;
  }

  /**
   * Reasignar postulante - cambiar estado a pendiente
   */
  reasignar(postulante: PostulanteConEstado) {
    if (this.loadingPostulantes) return;
    
    this.loadingPostulantes = true;
    this.mostrarInfo('Reasignando postulante...');
    this.apiService.reasignar(postulante.id, { 
      postulanteId: postulante.id,
      observaciones: 'Reasignado a pendiente desde frontend' 
    }).subscribe({
      next: (response) => {
        this.mostrarExito('Postulante reasignado exitosamente. Estado cambiado a Pendiente');
        this.recargarDatos();
      },
      error: (error) => {
        console.error('Error al reasignar:', error);
        this.mostrarError('Error al reasignar postulante');
        this.loadingPostulantes = false;
      }
    });
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
      case 'ausente': return 'ausente';
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
      case 'ausente': return 'Ausente';
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

  /**
   * Manejar selección de archivo Excel
   */
  onFileSelected(event: any) {
    const file = event.target.files[0];
    
    if (!file) {
      return;
    }

    // Validar que sea un archivo Excel
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel'
    ];

    if (!validTypes.includes(file.type)) {
      this.mostrarError('Solo se permiten archivos Excel (.xlsx, .xls)');
      event.target.value = '';
      return;
    }

    // Validar tamaño (máximo 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      this.mostrarError('El archivo no debe superar los 10MB');
      event.target.value = '';
      return;
    }

    // Subir archivo
    this.uploadingFile = true;
    this.mostrarInfo('Procesando archivo Excel...');

    this.apiService.subirExcel(file).subscribe({
      next: (response) => {
        this.uploadingFile = false;
        event.target.value = ''; // Limpiar el input

        if (response.success) {
          this.mostrarExito(
            `Datos cargados exitosamente:\n` +
            `${response.data.postulantes} postulantes\n` +
            `${response.data.plazas} plazas\n` +
            `Grupo: ${response.data.grupoOcupacional}`
          );
          
          // Recargar los datos
          this.recargarDatos();
        } else {
          this.mostrarError(response.message || 'Error al procesar el archivo');
        }
      },
      error: (error) => {
        this.uploadingFile = false;
        event.target.value = ''; // Limpiar el input
        
        console.error('Error al subir archivo:', error);
        
        let mensajeError = 'Error al procesar el archivo Excel';
        
        if (error.error && error.error.message) {
          mensajeError = error.error.message;
        } else if (error.message) {
          mensajeError = error.message;
        }
        
        this.mostrarError(mensajeError);
      }
    });
  }

  /**
   * Exportar postulantes a Excel
   */
  exportarExcel() {
    // Ordenar postulantes según el orden solicitado
    const ordenEstados: { [key: string]: number } = {
      'adjudicado': 1,
      'renuncio': 2,
      'desistido': 3,
      'ausente': 4,
      'pendiente': 5
    };

    const postulantesOrdenados = [...this.postulantes].sort((a, b) => {
      const ordenA = ordenEstados[a.estado] || 999;
      const ordenB = ordenEstados[b.estado] || 999;
      
      if (ordenA !== ordenB) {
        return ordenA - ordenB;
      }
      
      return (a.orden_merito || 0) - (b.orden_merito || 0);
    });

    // Preparar datos para el Excel
    const datosExcel = postulantesOrdenados.map(p => ({
      'Apellidos y Nombres': p.apellidos_nombres || '',
      'Grupo Ocupacional': p.grupo_ocupacional || '',
      'Estado': p.estado?.toUpperCase() || '',
      'RED': p.red_adjudicada || '',
      'IPRESS': p.ipress_adjudicada || '',
      'Sub Unidad': p.subunidad_adjudicada || ''
    }));

    // Crear libro de trabajo
    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(datosExcel);

    // Aplicar ancho de columnas
    ws['!cols'] = [
      { wch: 50 }, // Apellidos y Nombres
      { wch: 25 }, // Grupo Ocupacional
      { wch: 12 }, // Estado
      { wch: 20 }, // RED
      { wch: 30 }, // IPRESS
      { wch: 20 }  // Sub Unidad
    ];

    // Crear el libro
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Postulantes');

    // Generar nombre de archivo con fecha
    const fecha = new Date().toISOString().split('T')[0];
    const nombreArchivo = `Postulantes_${fecha}.xlsx`;

    // Descargar archivo
    XLSX.writeFile(wb, nombreArchivo);

    this.mostrarExito(`Excel generado exitosamente: ${postulantesOrdenados.length} postulantes`);
  }

  /**
   * Generar PDF de credenciales de adjudicación
   */
  generarPDFCredenciales() {
    // Filtrar solo postulantes adjudicados
    const adjudicados = this.postulantes.filter(p => p.estado === 'adjudicado');

    if (adjudicados.length === 0) {
      this.mostrarError('No hay postulantes adjudicados para generar credenciales');
      return;
    }

    // Cargar el logo y la imagen del bottom
    const logoImg = new Image();
    const bottomImg = new Image();
    logoImg.src = 'assets/images/logo-essalud.png';
    bottomImg.src = 'assets/images/bottom.png';
    
    let logoLoaded = false;
    let bottomLoaded = false;
    
    const checkBothLoaded = () => {
      if (logoLoaded && bottomLoaded) {
        this.generarPDFConImagenes(adjudicados, logoImg, bottomImg);
      }
    };
    
    logoImg.onload = () => {
      logoLoaded = true;
      checkBothLoaded();
    };
    
    bottomImg.onload = () => {
      bottomLoaded = true;
      checkBothLoaded();
    };
    
    logoImg.onerror = () => {
      console.warn('No se pudo cargar el logo');
      logoLoaded = true;
      checkBothLoaded();
    };
    
    bottomImg.onerror = () => {
      console.warn('No se pudo cargar la imagen del bottom');
      bottomLoaded = true;
      checkBothLoaded();
    };
  }

  /**
   * Generar PDF con imágenes cargadas
   */
  private generarPDFConImagenes(adjudicados: PostulanteConEstado[], logoImg: HTMLImageElement | null, bottomImg: HTMLImageElement | null) {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let pageNumber = 0;

    adjudicados.forEach((postulante, index) => {
      if (index > 0) {
        doc.addPage();
      }
      pageNumber++;

      // Márgenes
      const marginLeft = 20;
      const marginRight = 20;
      const marginTop = 10;
      let yPos = marginTop;

      // Agregar logo de EsSalud si está disponible (más grande)
      if (logoImg) {
        try {
          doc.addImage(logoImg, 'PNG', marginLeft, yPos, 45, 22);
        } catch (e) {
          console.warn('Error al agregar logo al PDF:', e);
        }
      }
      
      yPos += 25;

      // Encabezados en cursiva y centrados
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(12);
      doc.setTextColor(100, 100, 100);
      
      const texto1 = '"Decenio de la Igualdad de Oportunidades para Mujeres y Hombres"';
      const texto2 = '"Año de la recuperación y consolidación de la economía peruana"';
      
      doc.text(texto1, pageWidth / 2, yPos, { align: 'center' });
      yPos += 5;
      doc.text(texto2, pageWidth / 2, yPos, { align: 'center' });
      yPos += 15;

      // Título del marco legal (justificado, negrita, centrado)
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      
      const tituloLey = 'TERCERA ETAPA DE IMPLEMENTACIÓN DE LA LEY N° 31539, "LEY QUE';
      const tituloLey2 = 'AUTORIZA, EXCEPCIONALMENTE Y POR ÚNICA VEZ EN EL MARCO DE LA';
      const tituloLey3 = 'EMERGENCIA SANITARIA, EL CAMBIO DE CONTRATO CAS - COVID A CONTRATO';
      const tituloLey4 = 'CAS AL PERSONAL ASISTENCIAL EN EL SECTOR SALUD"';
      
      doc.text(tituloLey, pageWidth / 2, yPos, { align: 'center' });
      yPos += 5;
      doc.text(tituloLey2, pageWidth / 2, yPos, { align: 'center' });
      yPos += 5;
      doc.text(tituloLey3, pageWidth / 2, yPos, { align: 'center' });
      yPos += 5;
      doc.text(tituloLey4, pageWidth / 2, yPos, { align: 'center' });
      yPos += 15;

      // CREDENCIAL DE ADJUDICACIÓN (título principal)
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('CREDENCIAL DE ADJUDICACIÓN', pageWidth / 2, yPos, { align: 'center' });
      yPos += 15;

      // Texto introductorio
      doc.setFontSize(13);
      doc.setFont('helvetica', 'normal');
      doc.text('Por medio de la presente, se acredita a don(ña):', marginLeft, yPos);
      yPos += 15;

      // Nombre del postulante (MAYÚSCULAS, NEGRITA, CENTRADO)
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(17);
      const maxWidth = pageWidth - marginLeft - marginRight;
      const nombreCompleto = postulante.apellidos_nombres.toUpperCase();
      const lineasNombre = doc.splitTextToSize(nombreCompleto, maxWidth);
      doc.text(lineasNombre, pageWidth / 2, yPos, { align: 'center' });
      yPos += (lineasNombre.length * 6) + 6;

      // Párrafo de beneficiario
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(13);
      
      const cargo = postulante.grupo_ocupacional || 'CARGO NO ESPECIFICADO';
      const especialidad = postulante.especialidad && postulante.especialidad.trim() !== '' ? postulante.especialidad : null;
      const red = postulante.red_adjudicada || 'RED NO ESPECIFICADA';
      const ipress = postulante.ipress_adjudicada || 'IPRESS NO ESPECIFICADA';
      const subunidad = postulante.subunidad_adjudicada || 'SUBUNIDAD NO ESPECIFICADA';
      
      // Debug: Verificar datos del postulante
      console.log('Postulante para PDF:', {
        nombre: postulante.apellidos_nombres,
        cargo: cargo,
        especialidad: postulante.especialidad,
        especialidadProcesada: especialidad
      });
      
      // Construir texto del cargo con especialidad si existe
      const textoCargo = especialidad 
        ? `${cargo.toUpperCase()} en la especialidad de ${especialidad.toUpperCase()}`
        : cargo.toUpperCase();
      
      const textoBeneficiario = `Es beneficiario(a) en condición de apto del cargo de ${textoCargo} en la Red ${red.toUpperCase()} asignado(a) a ${ipress.toUpperCase()} y a la Subunidad ${subunidad.toUpperCase()}, según las disposiciones contenidas en la Resolución de Gerencia Central N° 1033-2025-GCGP-ESSALUD y sus modificatorias de acuerdo, en concordancia a lo señalado en la Ley N° 31539, "Ley que autoriza, excepcionalmente y por única vez en el marco de la emergencia sanitaria, el cambio de contrato CAS - COVID a contrato CAS al personal asistencial en el sector salud".`;
      
      const lineasBeneficiario = doc.splitTextToSize(textoBeneficiario, maxWidth);
      doc.text(lineasBeneficiario, marginLeft, yPos, { align: 'justify', maxWidth: maxWidth });
      yPos += lineasBeneficiario.length * 5 + 10;

      // Texto final
      doc.text('Se expide la presente, para conocimiento y fines pertinentes.', marginLeft, yPos);
      yPos += 15;

      // Fecha
      const fechaActual = new Date();
      const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 
                     'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
      const textoFecha = `Jesus Maria, ${fechaActual.getDate()} de ${meses[fechaActual.getMonth()]} de ${fechaActual.getFullYear()}`;
      doc.text(textoFecha, marginLeft, yPos);

      // Pie de página con imagen bottom
      if (bottomImg) {
        try {
          const footerY = pageHeight - 25;
          // Agregar imagen del bottom con ancho proporcional
          const bottomWidth = 80; // Ancho fijo más pequeño
          const bottomHeight = 20; // Altura restaurada
          const bottomX = 21; // Centrar horizontalmente
          doc.addImage(bottomImg, 'PNG', bottomX, footerY, bottomWidth, bottomHeight);
        } catch (e) {
          console.warn('Error al agregar imagen bottom al PDF:', e);
        }
      }
    });

    // Abrir PDF en nueva ventana
    const pdfBlob = doc.output('blob');
    const pdfUrl = URL.createObjectURL(pdfBlob);
    window.open(pdfUrl, '_blank');

    this.mostrarExito(`PDF generado: ${adjudicados.length} credenciales`);
  }
}