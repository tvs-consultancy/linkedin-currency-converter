import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { StatusBar } from 'expo-status-bar';
import type { ConversionResult } from './lib/types';
import { convertCurrency, fetchCurrencies } from './lib/api';

export default function App() {
  const [amount, setAmount] = useState('');
  const [from, setFrom] = useState('USD');
  const [to, setTo] = useState('EUR');
  const [currencies, setCurrencies] = useState<string[]>([]);
  const [result, setResult] = useState<ConversionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [converting, setConverting] = useState(false);
  const [loadingCurrencies, setLoadingCurrencies] = useState(false);
  const [currenciesError, setCurrenciesError] = useState<string | null>(null);

  const loadCurrencies = useCallback(async () => {
    if (loadingCurrencies) return;
    setLoadingCurrencies(true);
    setCurrenciesError(null);
    try {
      const data = await fetchCurrencies();
      setCurrencies(data.currencies);
      if (!data.currencies.includes('USD')) return;
      setFrom('USD');
      const defaultTo = data.currencies.includes('EUR') ? 'EUR' : data.currencies[1] ?? 'EUR';
      setTo(defaultTo);
    } catch (e) {
      setCurrenciesError((e as Error).message);
    } finally {
      setLoadingCurrencies(false);
    }
  }, [loadingCurrencies]);

  useEffect(() => {
    loadCurrencies();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function isValid(): boolean {
    const parsed = Number(amount);
    const positiveAmount = amount.trim() !== '' && !isNaN(parsed) && parsed > 0;
    const differentCurrencies = from !== to;
    const usdRequired = from === 'USD' || to === 'USD';
    return positiveAmount && differentCurrencies && usdRequired;
  }

  async function handleConvert() {
    if (!isValid()) return;
    setConverting(true);
    setError(null);
    setResult(null);
    try {
      const data = await convertCurrency(Number(amount), from, to);
      setResult(data);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setConverting(false);
    }
  }

  function formatResult(conversionResult: ConversionResult): string {
    try {
      return new Intl.NumberFormat('es-ES', {
        style: 'currency',
        currency: conversionResult.to,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(conversionResult.convertedAmount);
    } catch {
      return `${conversionResult.convertedAmount.toFixed(2)} ${conversionResult.to}`;
    }
  }

  const usdConstraintViolated =
    currencies.length > 0 && from !== to && from !== 'USD' && to !== 'USD';

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <StatusBar style="dark" />

      <View style={styles.card}>
        <Text style={styles.title} testID="app-title">Conversor de Divisas</Text>

        {/* Currency load error */}
        {currenciesError && (
          <View style={styles.banner}>
            <Text style={styles.bannerText}>{currenciesError}</Text>
            <Pressable onPress={loadCurrencies} disabled={loadingCurrencies}>
              <Text style={styles.bannerRetry}>Reintentar</Text>
            </Pressable>
          </View>
        )}

        {/* Initial currencies loading spinner */}
        {loadingCurrencies && currencies.length === 0 && (
          <ActivityIndicator style={styles.loadingSpinner} color="#2563eb" />
        )}

        {/* Amount input */}
        <Text style={styles.label}>Cantidad</Text>
        <TextInput
          testID="amount-input"
          style={styles.input}
          value={amount}
          onChangeText={(v) => {
            setAmount(v);
            setResult(null);
          }}
          keyboardType="decimal-pad"
          placeholder="0.00"
          placeholderTextColor="#9ca3af"
        />

        {/* From picker */}
        <Text style={styles.label}>De</Text>
        <View style={styles.pickerWrapper}>
          <Picker
            testID="from-picker"
            selectedValue={from}
            onValueChange={(value) => {
              setFrom(value);
              setResult(null);
            }}
          >
            {currencies.map((c) => (
              <Picker.Item key={c} label={c} value={c} />
            ))}
          </Picker>
        </View>

        {/* To picker */}
        <Text style={styles.label}>A</Text>
        <View style={styles.pickerWrapper}>
          <Picker
            testID="to-picker"
            selectedValue={to}
            onValueChange={(value) => {
              setTo(value);
              setResult(null);
            }}
          >
            {currencies.map((c) => (
              <Picker.Item key={c} label={c} value={c} />
            ))}
          </Picker>
        </View>

        {/* Validation hints */}
        {from === to && currencies.length > 0 && (
          <Text style={styles.hint}>Las monedas de origen y destino deben ser distintas.</Text>
        )}
        {usdConstraintViolated && (
          <Text style={styles.hint}>
            Una de las monedas debe ser USD.
          </Text>
        )}

        {/* Convert button */}
        <Pressable
          testID="convert-button"
          style={[styles.button, (!isValid() || converting) && styles.buttonDisabled]}
          onPress={handleConvert}
          disabled={!isValid() || converting}
        >
          {converting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Convertir</Text>
          )}
        </Pressable>

        {/* Error */}
        {error && <Text testID="error-text" style={styles.errorText}>{error}</Text>}

        {/* Result */}
        {result && (
          <View testID="result-container" style={styles.result}>
            <Text testID="result-amount" style={styles.resultAmount}>{formatResult(result)}</Text>
            <Text testID="result-rate" style={styles.resultRate}>
              1 {result.from} = {result.rate.toFixed(6)} {result.to}
            </Text>
            <Text style={styles.resultDescription}>{result.description}</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#f9fafb',
    justifyContent: 'center',
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 24,
    textAlign: 'center',
  },
  loadingSpinner: {
    marginVertical: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#111827',
    backgroundColor: '#f9fafb',
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    backgroundColor: '#f9fafb',
    overflow: 'hidden',
  },
  hint: {
    fontSize: 12,
    color: '#ef4444',
    marginTop: 8,
  },
  button: {
    backgroundColor: '#2563eb',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 24,
  },
  buttonDisabled: {
    backgroundColor: '#93c5fd',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    color: '#dc2626',
    fontSize: 14,
    marginTop: 12,
    textAlign: 'center',
  },
  result: {
    marginTop: 24,
    padding: 16,
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    alignItems: 'center',
  },
  resultAmount: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1d4ed8',
  },
  resultRate: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 4,
  },
  resultDescription: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 2,
    textAlign: 'center',
  },
  banner: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bannerText: {
    color: '#dc2626',
    fontSize: 13,
    flex: 1,
  },
  bannerRetry: {
    color: '#dc2626',
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 8,
  },
});
