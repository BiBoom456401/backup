package com.example.DACK.dto;

import lombok.Data;

import java.time.LocalDate;
import java.time.LocalTime;

@Data
public class BookingRequest {
    private Long fieldId;
    private LocalDate bookingDate;
    private LocalTime startTime;
    private LocalTime endTime;
    private String note;
}
