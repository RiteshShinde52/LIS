package com.lis.mobile.data

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import kotlinx.coroutines.flow.Flow

@Dao
interface LisDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun savePatient(patient: Patient)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun saveTests(testOrders: List<TestOrder>)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun saveBill(bill: Bill)

    @Query("SELECT * FROM patients ORDER BY date DESC")
    fun observePatients(): Flow<List<Patient>>

    @Query("SELECT * FROM patients WHERE name LIKE '%' || :query || '%' OR phone LIKE '%' || :query || '%' OR date = :query")
    fun searchPatients(query: String): Flow<List<Patient>>

    @Query("SELECT * FROM tests WHERE patientId = :patientId")
    fun observeTests(patientId: String): Flow<List<TestOrder>>
}
