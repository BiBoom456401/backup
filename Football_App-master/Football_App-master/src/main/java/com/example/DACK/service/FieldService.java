package com.example.DACK.service;

import com.example.DACK.model.Field;
import com.example.DACK.repository.FieldRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class FieldService {
    private final FieldRepository fieldRepository;

    public List<Field> getAllFields() {
        return fieldRepository.findAll();
    }

    public Optional<Field> getFieldById(Long id) {
        return fieldRepository.findById(id);
    }

    public Field saveField(Field field) {
        return fieldRepository.save(field);
    }

    public void deleteField(Long id) {
        fieldRepository.deleteById(id);
    }

    public List<Field> searchFields(String query) {
        // Simple search by name (can be enhanced with actual query method in repository)
        return fieldRepository.findAll().stream()
                .filter(f -> f.getName().toLowerCase().contains(query.toLowerCase()))
                .toList();
    }
}
