package com.hutech.NguyenNgocDuy.service;

import com.hutech.NguyenNgocDuy.model.Customer;
import com.hutech.NguyenNgocDuy.repository.CustomerRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
@RequiredArgsConstructor
public class PointService {
    private static final double POINT_EARNING_STEP = 100000;
    private static final double DISCOUNT_PER_POINT = 1000;

    private final CustomerRepository customerRepository;

    public int calculateEarnedPoints(double totalAmount) {
        return (int) Math.floor(totalAmount / POINT_EARNING_STEP);
    }

    public double calculateDiscountFromPoints(int points) {
        return Math.max(0, points) * DISCOUNT_PER_POINT;
    }

    public Customer getCustomerByPhone(String phone) {
        if (phone == null || phone.isBlank()) {
            return null;
        }
        return customerRepository.findByPhone(phone.trim()).orElse(null);
    }

    public Customer findOrCreateCustomer(String name, String phone, String email, String address) {
        if (phone == null || phone.isBlank()) {
            return null;
        }

        return customerRepository.findByPhone(phone.trim())
                .map(existing -> updateCustomer(existing, name, email, address))
                .orElseGet(() -> customerRepository.save(buildCustomer(name, phone.trim(), email, address)));
    }

    public boolean usePoints(Customer customer, int points) {
        if (customer == null || points <= 0 || customer.getPoints() < points) {
            return false;
        }

        customer.setPoints(customer.getPoints() - points);
        customerRepository.save(customer);
        return true;
    }

    public void addPoints(Customer customer, int points, double orderValue) {
        if (customer == null || points <= 0) {
            return;
        }

        customer.setPoints(customer.getPoints() + points);
        customer.setTotalSpent(customer.getTotalSpent() + orderValue);
        customer.setOrderCount(customer.getOrderCount() + 1);
        customerRepository.save(customer);
    }

    private Customer updateCustomer(Customer customer, String name, String email, String address) {
        customer.setName(name);
        customer.setEmail(email);
        customer.setAddress(address);
        return customerRepository.save(customer);
    }

    private Customer buildCustomer(String name, String phone, String email, String address) {
        Customer customer = new Customer();
        customer.setName(name);
        customer.setPhone(phone);
        customer.setEmail(email);
        customer.setAddress(address);
        customer.setPoints(0);
        customer.setTotalSpent(0);
        customer.setOrderCount(0);
        return customer;
    }
}