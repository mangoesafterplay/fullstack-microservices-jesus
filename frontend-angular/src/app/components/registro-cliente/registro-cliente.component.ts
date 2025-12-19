import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule
} from '@angular/forms';
import { MicroservicesSDK } from '../../sdk/microservices.sdk';

@Component({
  selector: 'app-registro-cliente',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule
  ],
  templateUrl: './registro-cliente.component.html',
  styleUrls: ['./registro-cliente.component.scss']
})
export class RegistroClienteComponent implements OnInit {

  registroForm!: FormGroup;
  
  loading = false;
  loadingToken = false;
  
  successMessage = '';
  errorMessage = '';
  tokenValid: boolean | null = null;
  
  selectedBono: number | null = null;
  bonoValues = {
    1: 0,    // 100 giros gratis
    2: 50,   // Apuesta gratis S/50
    3: 0     // Sin bono
  };
  
  tiposDocumento = ['DNI', 'Carnet de extranjería'];
  
  // Arrays para fecha de nacimiento (solo para UI)
  years: number[] = [];
  months = [
    { value: '01', name: 'Enero' },
    { value: '02', name: 'Febrero' },
    { value: '03', name: 'Marzo' },
    { value: '04', name: 'Abril' },
    { value: '05', name: 'Mayo' },
    { value: '06', name: 'Junio' },
    { value: '07', name: 'Julio' },
    { value: '08', name: 'Agosto' },
    { value: '09', name: 'Septiembre' },
    { value: '10', name: 'Octubre' },
    { value: '11', name: 'Noviembre' },
    { value: '12', name: 'Diciembre' }
  ];
  days: number[] = Array.from({ length: 31 }, (_, i) => i + 1);

  constructor(
    private fb: FormBuilder,
    private sdk: MicroservicesSDK
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.generateYears();
    this.selectBono(2); // Seleccionar bono 2 por defecto
    setTimeout(() => {
      this.generateToken();
    });
  }

  private generateYears(): void {
    const currentYear = new Date().getFullYear();
    const startYear = currentYear - 100;
    
    for (let year = currentYear; year >= startYear; year--) {
      this.years.push(year);
    }
  }

  private initForm(): void {
    this.registroForm = this.fb.group({
      token: ['', [
        Validators.required,
        Validators.minLength(8),
        Validators.maxLength(8)
      ]],
      bono_bienvenida: [0, [Validators.min(0)]],
      tipo_documento: ['DNI', Validators.required],
      numero_documento: ['', [Validators.required, Validators.minLength(8)]],
      nombres: ['', [Validators.required, Validators.minLength(2)]],
      apellidos: ['', [Validators.required, Validators.minLength(2)]],
      // Campos separados para la UI
      anio: ['', Validators.required],
      mes: ['', Validators.required],
      dia: ['', Validators.required],
      email: ['', [Validators.email]],
      telefono: ['', [Validators.minLength(7)]],
    });
  }

  selectBono(bonoNumber: number): void {
    this.selectedBono = bonoNumber;
    const bonoValue = this.bonoValues[bonoNumber as keyof typeof this.bonoValues];
    this.registroForm.patchValue({ bono_bienvenida: bonoValue });
  }

  generateToken(): void {
    this.loadingToken = true;
    this.errorMessage = '';

    this.sdk.generateToken().subscribe({
      next: (response) => {
        if (response.success) {
          this.registroForm.patchValue({
            token: response.data.token
          });
          this.tokenValid = true;
        }
        this.loadingToken = false;
      },
      error: (error) => {
        this.errorMessage = error.message;
        this.loadingToken = false;
      }
    });
  }

  onTokenChange(): void {
    const token = this.registroForm.get('token')?.value;

    if (token?.length === 8) {
      this.sdk.validateToken(token).subscribe({
        next: (response) => {
          this.tokenValid = response.valid;
          this.errorMessage = response.valid ? '' : response.message;
        },
        error: () => {
          this.tokenValid = false;
          this.errorMessage = 'Error al validar token';
        }
      });
    } else {
      this.tokenValid = null;
    }
  }

  private getFechaNacimiento(): string {
    const anio = this.registroForm.get('anio')?.value;
    const mes = this.registroForm.get('mes')?.value;
    const dia = this.registroForm.get('dia')?.value;
    
    if (!anio || !mes || !dia) return '';
    
    return `${anio}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
  }

  private calculateAge(birthDate: string): number {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birth.getDate())
    ) {
      age--;
    }
    return age;
  }

  onSubmit(): void {
    if (this.registroForm.invalid) {
      this.markFormGroupTouched(this.registroForm);
      this.errorMessage = 'Por favor completa todos los campos requeridos';
      return;
    }

    if (!this.tokenValid) {
      this.errorMessage = 'Token inválido';
      return;
    }

    if (this.selectedBono === null) {
      this.errorMessage = 'Por favor selecciona un bono de bienvenida';
      return;
    }

    const fechaNacimiento = this.getFechaNacimiento();
    const age = this.calculateAge(fechaNacimiento);

    if (age < 18) {
      this.errorMessage = 'Debes ser mayor de 18 años para registrarte';
      return;
    }

    // Preparar datos para enviar - CORREGIDO según el backend
    const formData = {
      token: this.registroForm.get('token')?.value,
      bono_bienvenida: this.registroForm.get('bono_bienvenida')?.value,
      tipo_documento: this.registroForm.get('tipo_documento')?.value,
      numero_documento: this.registroForm.get('numero_documento')?.value,
      nombres: this.registroForm.get('nombres')?.value,
      apellidos: this.registroForm.get('apellidos')?.value,
      fecha_nacimiento: fechaNacimiento,
      // Importante: Para campos opcionales, enviar null o undefined, NO string vacío
      email: this.registroForm.get('email')?.value?.trim() || null,
      telefono: this.registroForm.get('telefono')?.value?.trim() || null
    };

    console.log('📤 Datos a enviar a la API:', formData);
    console.log('📤 Formato JSON:', JSON.stringify(formData));

    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    // Asegúrate de que tu SDK envíe solo formData
    this.sdk.registerCliente(formData).subscribe({
      next: (response) => {
        console.log('✅ Respuesta del servidor:', response);
        if (response.success) {
          this.successMessage = '¡Cliente registrado exitosamente!';
          this.registroForm.reset({
            tipo_documento: 'DNI'
          });
          this.generateToken();
          this.selectedBono = 2; // Resetear a bono 2

          setTimeout(() => {
            this.successMessage = '';
          }, 5000);
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('❌ Error en registro:', error);
        console.error('❌ Detalles del error:', error.error);
        
        // Manejo mejorado de errores
        if (error.error && error.error.message) {
          this.errorMessage = error.error.message;
        } else if (error.message) {
          this.errorMessage = error.message;
        } else {
          this.errorMessage = 'Error al registrar cliente. Por favor intenta nuevamente.';
        }
        
        this.loading = false;
      }
    });
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();

      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  getErrorMessage(fieldName: string): string {
    const field = this.registroForm.get(fieldName);

    if (field?.hasError('required')) {
      return 'Este campo es requerido';
    }
    if (field?.hasError('minlength')) {
      return `Mínimo ${field.errors?.['minlength'].requiredLength} caracteres`;
    }
    if (field?.hasError('email')) {
      return 'Email inválido';
    }
    if (field?.hasError('min')) {
      return 'El valor debe ser mayor o igual a 0';
    }
    return '';
  }
}