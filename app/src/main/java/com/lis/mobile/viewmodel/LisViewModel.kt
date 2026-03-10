package com.lis.mobile.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.lis.mobile.data.Bill
import com.lis.mobile.data.Department
import com.lis.mobile.data.Interpretation
import com.lis.mobile.data.LisRepository
import com.lis.mobile.data.Patient
import com.lis.mobile.data.TestOrder
import com.lis.mobile.data.UserRole
import com.lis.mobile.data.UserSession
import com.lis.mobile.domain.CalculationEngine
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import java.time.Instant
import java.util.UUID

class LisViewModel(private val repo: LisRepository) : ViewModel() {
    private val _session = MutableStateFlow<UserSession?>(null)
    val session: StateFlow<UserSession?> = _session.asStateFlow()

    private val _selectedTests = MutableStateFlow<List<Pair<Department, String>>>(emptyList())
    val selectedTests = _selectedTests.asStateFlow()

    private val _interpretations = MutableStateFlow<List<Interpretation>>(emptyList())
    val interpretations = _interpretations.asStateFlow()

    private val _alerts = MutableStateFlow<List<String>>(emptyList())
    val alerts = _alerts.asStateFlow()

    val catalog = repo.departmentTestCatalog()

    fun login(username: String, role: UserRole, otp: String?) {
        if (otp.isNullOrBlank() || otp.length >= 4) {
            _session.value = UserSession(username, role, Instant.now().toEpochMilli() + (30 * 60 * 1000))
        }
    }

    fun checkSessionTimeout() {
        if ((_session.value?.expiresAtMillis ?: 0L) < Instant.now().toEpochMilli()) _session.value = null
    }

    fun toggleTest(department: Department, test: String) {
        val current = _selectedTests.value.toMutableList()
        val item = department to test
        if (current.contains(item)) current.remove(item) else current.add(item)
        _selectedTests.value = current
    }

    fun registerPatient(patient: Patient) = viewModelScope.launch {
        repo.registerPatient(patient)
        val orders = _selectedTests.value.map {
            TestOrder(
                patientId = patient.patientId,
                department = it.first,
                testName = it.second,
                normalRange = normalRange(it.second, patient.sex, patient.age),
                unit = unitFor(it.second)
            )
        }
        repo.saveResults(orders)
    }

    fun processValues(values: Map<String, Double>) {
        _interpretations.value = CalculationEngine.aiPatterns(values)
        _alerts.value = CalculationEngine.criticalAlerts(values)
    }

    fun createBill(patientId: String, total: Double, discount: Double, payment: String): Bill {
        val reportNo = "RPT-${UUID.randomUUID().toString().take(8).uppercase()}"
        return Bill(
            billNumber = reportNo,
            reportNumber = reportNo,
            patientId = patientId,
            totalAmount = total,
            discount = discount,
            finalAmount = total - discount,
            paymentMethod = payment
        )
    }

    private fun normalRange(test: String, sex: String, age: Int): String = when (test) {
        "Hemoglobin" -> if (sex == "Female") "12-15 g/dL" else "13-17 g/dL"
        "TSH" -> if (age < 18) "0.5-4.5" else "0.4-4.0"
        "INR" -> "0.8-1.2"
        else -> "Lab configured"
    }

    private fun unitFor(test: String): String = when (test) {
        "Hemoglobin" -> "g/dL"
        "Blood glucose" -> "mg/dL"
        "TSH" -> "mIU/L"
        "INR" -> "ratio"
        else -> "-"
    }
}

class LisViewModelFactory(private val repo: LisRepository) : ViewModelProvider.Factory {
    override fun <T : ViewModel> create(modelClass: Class<T>): T = LisViewModel(repo) as T
}
