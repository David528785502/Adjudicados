import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  ApiResponse,
  Postulante,
  PostulanteConEstado,
  Plaza,
  PlazaConDisponibilidad,
  Ipress,
  Red,
  GrupoOcupacional,
  Adjudicacion,
  FiltroPostulantes,
  FiltroPlazas,
  RequestAdjudicar,
  RequestDesistir,
  RequestRenunciar
} from '../models/interfaces';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private apiUrl = environment.apiUrl;
  private http = inject(HttpClient);

  // ==========================================
  // POSTULANTES
  // ==========================================

  /**
   * Obtener postulantes con filtros
   */
  getPostulantes(filtros?: FiltroPostulantes): Observable<ApiResponse<PostulanteConEstado[]>> {
    let params = new HttpParams();
    
    if (filtros) {
      if (filtros.grupoOcupacionalId) {
        params = params.set('grupoOcupacionalId', filtros.grupoOcupacionalId.toString());
      }
      if (filtros.estado) {
        params = params.set('estado', filtros.estado);
      }
      if (filtros.search) {
        params = params.set('search', filtros.search);
      }
      if (filtros.page) {
        params = params.set('page', filtros.page.toString());
      }
      if (filtros.limit) {
        params = params.set('limit', filtros.limit.toString());
      }
    }

    return this.http.get<ApiResponse<PostulanteConEstado[]>>(`${this.apiUrl}/postulantes`, { params });
  }

  /**
   * Obtener postulantes con su estado completo
   */
  getPostulantesConEstado(): Observable<ApiResponse<PostulanteConEstado[]>> {
    return this.http.get<ApiResponse<PostulanteConEstado[]>>(`${this.apiUrl}/postulantes`);
  }

  /**
   * Obtener postulante por ID
   */
  getPostulante(id: number): Observable<ApiResponse<Postulante>> {
    return this.http.get<ApiResponse<Postulante>>(`${this.apiUrl}/postulantes/${id}`);
  }

  // ==========================================
  // PLAZAS E IPRESS
  // ==========================================

  /**
   * Obtener plazas con disponibilidad
   */
  getPlazasConDisponibilidad(filtros?: FiltroPlazas): Observable<ApiResponse<PlazaConDisponibilidad[]>> {
    let params = new HttpParams();
    
    if (filtros) {
      if (filtros.redId) {
        params = params.set('redId', filtros.redId.toString());
      }
      if (filtros.ipressId) {
        params = params.set('ipressId', filtros.ipressId.toString());
      }
      if (filtros.grupoOcupacionalId) {
        params = params.set('grupoOcupacionalId', filtros.grupoOcupacionalId.toString());
      }
      if (filtros.soloDisponibles) {
        params = params.set('soloDisponibles', 'true');
      }
      if (filtros.page) {
        params = params.set('page', filtros.page.toString());
      }
      if (filtros.limit) {
        params = params.set('limit', filtros.limit.toString());
      }
    }

    return this.http.get<ApiResponse<PlazaConDisponibilidad[]>>(`${this.apiUrl}/plazas`, { params });
  }

  /**
   * Obtener todas las plazas
   */
  getPlazas(filtros?: FiltroPlazas): Observable<ApiResponse<Plaza[]>> {
    let params = new HttpParams();
    
    if (filtros) {
      if (filtros.redId) {
        params = params.set('redId', filtros.redId.toString());
      }
      if (filtros.ipressId) {
        params = params.set('ipressId', filtros.ipressId.toString());
      }
      if (filtros.grupoOcupacionalId) {
        params = params.set('grupoOcupacionalId', filtros.grupoOcupacionalId.toString());
      }
    }

    return this.http.get<ApiResponse<Plaza[]>>(`${this.apiUrl}/plazas`, { params });
  }

  /**
   * Obtener IPRESS
   */
  getIpress(): Observable<ApiResponse<Ipress[]>> {
    return this.http.get<ApiResponse<Ipress[]>>(`${this.apiUrl}/ipress`);
  }

  /**
   * Obtener IPRESS por red
   */
  getIpressByRed(redId: number): Observable<ApiResponse<Ipress[]>> {
    return this.http.get<ApiResponse<Ipress[]>>(`${this.apiUrl}/ipress/by-red/${redId}`);
  }

  // ==========================================
  // REDES Y GRUPOS OCUPACIONALES
  // ==========================================

  /**
   * Obtener todas las redes
   */
  getRedes(): Observable<ApiResponse<Red[]>> {
    return this.http.get<ApiResponse<Red[]>>(`${this.apiUrl}/redes`);
  }

  /**
   * Obtener grupos ocupacionales
   */
  getGruposOcupacionales(): Observable<ApiResponse<GrupoOcupacional[]>> {
    return this.http.get<ApiResponse<GrupoOcupacional[]>>(`${this.apiUrl}/grupos-ocupacionales`);
  }

  // ==========================================
  // ADJUDICACIONES
  // ==========================================

  /**
   * Realizar adjudicación manual
   */
  adjudicar(request: RequestAdjudicar): Observable<ApiResponse<Adjudicacion>> {
    return this.http.post<ApiResponse<Adjudicacion>>(`${this.apiUrl}/adjudicaciones/adjudicar`, request);
  }

  /**
   * Realizar adjudicación automática
   */
  adjudicarAutomatico(grupoOcupacionalId: number, ipressId: number): Observable<ApiResponse<Adjudicacion>> {
    return this.http.post<ApiResponse<Adjudicacion>>(`${this.apiUrl}/adjudicaciones/adjudicar`, {
      grupoOcupacionalId,
      ipressId
    });
  }

  /**
   * Marcar postulante como desistido
   */
  desistir(postulanteId: number, request: RequestDesistir): Observable<ApiResponse<Adjudicacion>> {
    return this.http.post<ApiResponse<Adjudicacion>>(`${this.apiUrl}/adjudicaciones/desistir/${postulanteId}`, request);
  }

  /**
   * Marcar adjudicación como renuncia
   */
  renunciar(postulanteId: number, request: RequestRenunciar): Observable<ApiResponse<Adjudicacion>> {
    return this.http.post<ApiResponse<Adjudicacion>>(`${this.apiUrl}/adjudicaciones/renuncia/${postulanteId}`, request);
  }

  /**
   * Marcar postulante como ausente
   */
  marcarAusente(postulanteId: number, request: RequestDesistir): Observable<ApiResponse<Adjudicacion>> {
    return this.http.post<ApiResponse<Adjudicacion>>(`${this.apiUrl}/adjudicaciones/ausente/${postulanteId}`, request);
  }

  /**
   * Obtener adjudicaciones
   */
  getAdjudicaciones(): Observable<ApiResponse<Adjudicacion[]>> {
    return this.http.get<ApiResponse<Adjudicacion[]>>(`${this.apiUrl}/adjudicaciones`);
  }

  /**
   * Obtener adjudicaciones completas
   */
  getAdjudicacionesCompletas(): Observable<ApiResponse<Adjudicacion[]>> {
    return this.http.get<ApiResponse<Adjudicacion[]>>(`${this.apiUrl}/adjudicaciones/completas`);
  }

  /**
   * Validar si se puede realizar una adjudicación
   */
  validarAdjudicacion(postulanteId: number, plazaId: number): Observable<ApiResponse<boolean>> {
    const params = new HttpParams()
      .set('postulanteId', postulanteId.toString())
      .set('plazaId', plazaId.toString());
    
    return this.http.get<ApiResponse<boolean>>(`${this.apiUrl}/adjudicaciones/validar`, { params });
  }

  // ==========================================
  // ESTADÍSTICAS (para uso futuro)
  // ==========================================

  /**
   * Obtener estadísticas generales
   */
  getEstadisticas(): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.apiUrl}/adjudicaciones/stats`);
  }

  /**
   * Obtener dashboard
   */
  getDashboard(): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.apiUrl}/adjudicaciones/dashboard`);
  }
}