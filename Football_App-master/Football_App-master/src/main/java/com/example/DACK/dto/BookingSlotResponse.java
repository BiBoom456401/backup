package com.example.DACK.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class BookingSlotResponse {
    private final String startTime;
    private final String endTime;
    private final String status;
    private final String statusLabel;
}
