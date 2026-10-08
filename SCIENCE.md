# Notas Científicas y Modelos Pedagógicos — QuantumLab v1.0

## Misiones y Modelos Didácticos

### 1. Superposición y Colapso
- **Modelo:** Esfera de Bloch parametrizada por el ángulo $\theta \in [0, \pi]$.
- **Amplitudes:** $\alpha = \cos(\theta / 2)$, $\beta = \sin(\theta / 2)$.
- **Probabilidades:** $P(|0\rangle) = |\alpha|^2$, $P(|1\rangle) = |\beta|^2$.

### 2. Entrelazamiento
- **Estado de Bell:** $|\Phi^+\rangle = \frac{1}{\sqrt{2}}(|00\rangle + |11\rangle)$.
- **Comportamiento:** La medición determinista en una estación fija el estado colapsado instantáneamente en la estación distante.

### 3. Decoherencia Térmica
- **Rango Físico:** $15\text{ mK}$ ($0,015\text{ K}$) a $300\text{ K}$ ($300.000\text{ mK}$).
- **Modelo:** Tiempo de coherencia $T_2(T) = 250 \cdot e^{-T / 800}\text{ }\mu\text{s}$.
- **Unidades:** Conversión unificada y consistente entre miliKelvin y Kelvin sin cambios silenciosos de firma.

### 4. Algoritmo de Shor (Demostración Didáctica N = 15)
- **Alcance:** Factorización transparente de $N = 15$ con bases $a \in \{2, 7, 8, 11, 13\}$.
- **Paso Matemático Verificable:** Secuencia modular $a^x \pmod{15}$, determinación del período $r$, cálculo de $a^{r/2} \pmod{15}$, y extracción de factores vía $\gcd(a^{r/2} \pm 1, 15)$.
- **Aclaración Didáctica:** La interfaz y documentación no presentan simulaciones ficticias ni afirmaciones engañosas sobre la ejecución de Shor en RSA-2048.
