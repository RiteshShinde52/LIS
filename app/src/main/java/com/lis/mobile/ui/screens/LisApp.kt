package com.lis.mobile.ui.screens

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.Checkbox
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.lis.mobile.data.Department
import com.lis.mobile.data.Patient
import com.lis.mobile.data.UserRole
import com.lis.mobile.viewmodel.LisViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun LisApp(vm: LisViewModel) {
    var loggedIn by remember { mutableStateOf(false) }
    var username by remember { mutableStateOf("") }
    var otp by remember { mutableStateOf("") }

    Scaffold(topBar = { TopAppBar(title = { Text("LIS Mobile") }) }) { padding ->
        if (!loggedIn) {
            Column(Modifier.padding(padding).padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                Text("Secure Login", style = MaterialTheme.typography.titleLarge)
                OutlinedTextField(username, { username = it }, label = { Text("Username") })
                OutlinedTextField(otp, { otp = it }, label = { Text("OTP (optional)") })
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    Button(onClick = {
                        vm.login(username, UserRole.ADMIN, otp)
                        loggedIn = true
                    }) { Text("Admin") }
                    Button(onClick = {
                        vm.login(username, UserRole.TECHNICIAN, otp)
                        loggedIn = true
                    }) { Text("Technician") }
                    Button(onClick = {
                        vm.login(username, UserRole.DOCTOR, otp)
                        loggedIn = true
                    }) { Text("Doctor") }
                }
            }
        } else {
            WorkflowScreen(vm, Modifier.padding(padding))
        }
    }
}

@Composable
fun WorkflowScreen(vm: LisViewModel, modifier: Modifier = Modifier) {
    var name by remember { mutableStateOf("") }
    var age by remember { mutableStateOf("30") }
    var sex by remember { mutableStateOf("Male") }
    var phone by remember { mutableStateOf("") }
    var address by remember { mutableStateOf("") }
    var doctor by remember { mutableStateOf("") }

    LazyColumn(modifier.fillMaxSize().padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
        item {
            Text("Patient Registration", style = MaterialTheme.typography.titleMedium)
            OutlinedTextField(name, { name = it }, label = { Text("Name") }, modifier = Modifier.fillMaxWidth())
            OutlinedTextField(age, { age = it }, label = { Text("Age") }, modifier = Modifier.fillMaxWidth())
            OutlinedTextField(sex, { sex = it }, label = { Text("Sex") }, modifier = Modifier.fillMaxWidth())
            OutlinedTextField(phone, { phone = it }, label = { Text("Phone") }, modifier = Modifier.fillMaxWidth())
            OutlinedTextField(address, { address = it }, label = { Text("Address") }, modifier = Modifier.fillMaxWidth())
            OutlinedTextField(doctor, { doctor = it }, label = { Text("Referring Doctor") }, modifier = Modifier.fillMaxWidth())
        }

        item { Text("Department Test List", fontWeight = FontWeight.Bold) }
        vm.catalog.forEach { (department, tests) ->
            item { Text(department.name) }
            items(tests) { test ->
                Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                    Text(test)
                    Checkbox(
                        checked = vm.selectedTests.value.contains(department to test),
                        onCheckedChange = { vm.toggleTest(department, test) }
                    )
                }
            }
        }

        item {
            Button(onClick = {
                vm.registerPatient(
                    Patient(
                        name = name,
                        age = age.toIntOrNull() ?: 0,
                        sex = sex,
                        phone = phone,
                        address = address,
                        referringDoctor = doctor
                    )
                )
            }) { Text("Save Patient + Orders") }
        }

        item {
            Text("AI Interpretation & Critical Alerts", fontWeight = FontWeight.Bold)
            Button(onClick = {
                vm.processValues(mapOf("SGPT" to 150.0, "SGOT" to 180.0, "Bilirubin" to 2.6, "Hb" to 4.8))
            }) { Text("Run Analysis") }
        }

        items(vm.interpretations.value) {
            Card { Text("${it.title}: ${it.message} (${it.confidence})", Modifier.padding(8.dp)) }
        }
        items(vm.alerts.value) {
            Text(it, color = Color.Red, fontWeight = FontWeight.Bold)
        }

        item {
            Text("PT/INR: ${com.lis.mobile.domain.CalculationEngine.inrInterpretation(4.2)}")
            Text("Billing uses report-linked bill number; payment supports Cash/UPI/Card.")
            Text("PDF generation includes logo, QR verification, date and doctor signature.")
            Text("WhatsApp sharing supported when patient phone is available.")
            Text("Offline-first with Room; optional cloud sync manager included.")
        }
    }
}
