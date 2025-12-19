import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../environments/environment';


export interface TokenResponse {
  success: boolean;
  message: string;
  data: {
    token: string;
    expiresAt: string;
  };
}

export interface TokenValidation {
  success: boolean;
  valid: boolean;
  message: string;
}

export interface ClienteData {
  token: string;
  bono_bienvenida?: number;
  tipo_documento: string;
  numero_documento: string;
  nombres: string;
  apellidos: string;
  fecha_nacimiento: string;
  email?: string;
  telefono?: string;
}

export interface ClienteResponse {
  success: boolean;
  message: string;
  data: any;
}

@Injectable({
  providedIn: 'root'
})
export class MicroservicesSDK {
  private seguridadUrl: string;
  private clientesUrl: string;
  private httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json'
    })
  };

  constructor(private http: HttpClient) {
    this.seguridadUrl = environment.apiSeguridadUrl || 'http://localhost:3001';
    this.clientesUrl = environment.apiClientesUrl || 'http://localhost:3002';
  }

  /**
   * Genera un nuevo token de seguridad
   */
  generateToken(): Observable<TokenResponse> {
    return this.http.post<TokenResponse>(
      `${this.seguridadUrl}/api/tokens/generate`,
      {},
      this.httpOptions
    ).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Valida un token de seguridad
   */
  validateToken(token: string): Observable<TokenValidation> {
    return this.http.post<TokenValidation>(
      `${this.seguridadUrl}/api/tokens/validate`,
      { token },
      this.httpOptions
    ).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Registra un nuevo cliente
   */
  registerCliente(clienteData: ClienteData): Observable<ClienteResponse> {
    return this.http.post<ClienteResponse>(
      `${this.clientesUrl}/api/clientes/register`,
      clienteData,
      this.httpOptions
    ).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Obtiene un cliente por ID
   */
  getCliente(id: number): Observable<any> {
    return this.http.get<any>(
      `${this.clientesUrl}/api/clientes/${id}`,
      this.httpOptions
    ).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Obtiene todos los clientes
   */
  getAllClientes(limit: number = 50, offset: number = 0): Observable<any> {
    return this.http.get<any>(
      `${this.clientesUrl}/api/clientes?limit=${limit}&offset=${offset}`,
      this.httpOptions
    ).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Manejo de errores
   */
  private handleError(error: any) {
    let errorMessage = 'Error desconocido';
    
    if (error.error instanceof ErrorEvent) {
      // Error del lado del cliente
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Error del lado del servidor
      errorMessage = error.error?.error?.message || 
                     error.error?.message || 
                     `Error ${error.status}: ${error.message}`;
    }
    
    console.error('SDK Error:', errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}