package com.example.DACK.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "fields")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Field {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    private String type; // e.g., Sân 5, Sân 7, Sân 11

    private Double price;

    private String address;

    @Column(length = 1000)
    private String description;

    private String imageUrl;
}
