package com.lis.mobile.data

import androidx.room.Database
import androidx.room.RoomDatabase
import androidx.room.TypeConverter
import androidx.room.TypeConverters

class DepartmentConverter {
    @TypeConverter
    fun fromDepartment(department: Department): String = department.name

    @TypeConverter
    fun toDepartment(value: String): Department = Department.valueOf(value)
}

@Database(entities = [Patient::class, TestOrder::class, Bill::class], version = 1)
@TypeConverters(DepartmentConverter::class)
abstract class LisDatabase : RoomDatabase() {
    abstract fun lisDao(): LisDao
}
