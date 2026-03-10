package com.lis.mobile.data

import androidx.room.Entity
import androidx.room.PrimaryKey
import java.time.LocalDate
import java.util.UUID

enum class UserRole { ADMIN, TECHNICIAN, DOCTOR }

data class UserSession(
    val username: String,
    val role: UserRole,
    val expiresAtMillis: Long
)

@Entity(tableName = "patients")
data class Patient(
    @PrimaryKey val patientId: String = "PAT-${UUID.randomUUID().toString().take(8).uppercase()}",
    val name: String,
    val age: Int,
    val sex: String,
    val phone: String,
    val address: String,
    val referringDoctor: String,
    val date: String = LocalDate.now().toString()
)

enum class Department { HEMATOLOGY, BIOCHEMISTRY, SEROLOGY, HORMONES, COAGULATION }

@Entity(tableName = "tests")
data class TestOrder(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val patientId: String,
    val department: Department,
    val testName: String,
    val normalRange: String,
    val unit: String,
    val result: String = "",
    val isAbnormal: Boolean = false
)

data class Interpretation(
    val title: String,
    val message: String,
    val confidence: String
)

@Entity(tableName = "bills")
data class Bill(
    @PrimaryKey val billNumber: String,
    val patientId: String,
    val reportNumber: String,
    val totalAmount: Double,
    val discount: Double,
    val finalAmount: Double,
    val paymentMethod: String,
    val createdAt: String = LocalDate.now().toString()
)
