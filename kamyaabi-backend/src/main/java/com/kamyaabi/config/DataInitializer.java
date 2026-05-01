package com.kamyaabi.config;

import com.kamyaabi.entity.Category;
import com.kamyaabi.entity.Product;
import com.kamyaabi.entity.User;
import com.kamyaabi.repository.CategoryRepository;
import com.kamyaabi.repository.ProductRepository;
import com.kamyaabi.repository.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

import java.math.BigDecimal;

@Slf4j
@Configuration
@Profile({"dev", "local"})
public class DataInitializer {

    @Bean
    CommandLineRunner initData(CategoryRepository categoryRepo,
                               ProductRepository productRepo,
                               UserRepository userRepo) {
        return args -> {
            if (categoryRepo.count() > 0) {
                log.info("Data already initialized, skipping...");
                return;
            }

            log.info("Initializing sample data...");

            if (!userRepo.existsByEmail("omprakashornold@gmail.com")) {
                User adminUser = User.builder()
                        .email("omprakashornold@gmail.com")
                        .name("Admin User")
                        .role(User.Role.ADMIN)
                        .googleId("admin-default")
                        .build();
                userRepo.save(adminUser);
                log.info("Default admin user created: omprakashornold@gmail.com");
            }

            Category cashews = categoryRepo.save(Category.builder()
                    .name("Cashews")
                    .description("Premium quality cashews sourced from the finest farms")
                    .imageUrl("https://images.unsplash.com/photo-1599599810694-b5b37304c041?w=400")
                    .build());

            Category almonds = categoryRepo.save(Category.builder()
                    .name("Almonds")
                    .description("California almonds - regular and jumbo varieties")
                    .imageUrl("https://images.unsplash.com/photo-1508061253366-f7da158b6d46?w=400")
                    .build());

            Category pistachios = categoryRepo.save(Category.builder()
                    .name("Pistachios")
                    .description("Roasted and salted pistachios with rich flavor")
                    .imageUrl("https://images.unsplash.com/photo-1525171254930-643fc658b64e?w=400")
                    .build());

            Category dryFruits = categoryRepo.save(Category.builder()
                    .name("Mixed Dry Fruits")
                    .description("Premium assorted dry fruits collection")
                    .imageUrl("https://images.unsplash.com/photo-1596591868231-05e882e12e21?w=400")
                    .build());

            productRepo.save(Product.builder()
                    .name("Whole Cashews W320")
                    .description("Creamy, Rich, Mild, Buttery, Sweet, Crisp. Our premium whole cashews are carefully selected for their superior quality and taste.")
                    .price(new BigDecimal("899.00"))
                    .discountPrice(new BigDecimal("749.00"))
                    .imageUrl("https://images.unsplash.com/photo-1599599810694-b5b37304c041?w=600")
                    .category(cashews)
                    .stock(100)
                    .weight("500")
                    .unit("gm")
                    .active(true)
                    .build());

            productRepo.save(Product.builder()
                    .name("Premium Split Cashews")
                    .description("Buttery, Smooth, Mild, Rich, Nutty, Sweet. Perfect for cooking and snacking.")
                    .price(new BigDecimal("699.00"))
                    .discountPrice(new BigDecimal("599.00"))
                    .imageUrl("https://images.unsplash.com/photo-1599599810694-b5b37304c041?w=600")
                    .category(cashews)
                    .stock(150)
                    .weight("500")
                    .unit("gm")
                    .active(true)
                    .build());

            productRepo.save(Product.builder()
                    .name("California Almonds - Jumbo")
                    .description("Savory, Crisp, Robust, Natural, Toasted, Wholesome. Handpicked jumbo California almonds.")
                    .price(new BigDecimal("999.00"))
                    .discountPrice(new BigDecimal("849.00"))
                    .imageUrl("https://images.unsplash.com/photo-1508061253366-f7da158b6d46?w=600")
                    .category(almonds)
                    .stock(80)
                    .weight("500")
                    .unit("gm")
                    .active(true)
                    .build());

            productRepo.save(Product.builder()
                    .name("Almonds - Regular")
                    .description("Rich, Nutty, Crunchy, Fresh, Earthy, Bold. Premium quality regular almonds.")
                    .price(new BigDecimal("749.00"))
                    .discountPrice(new BigDecimal("649.00"))
                    .imageUrl("https://images.unsplash.com/photo-1508061253366-f7da158b6d46?w=600")
                    .category(almonds)
                    .stock(120)
                    .weight("500")
                    .unit("gm")
                    .active(true)
                    .build());

            productRepo.save(Product.builder()
                    .name("Roasted & Salted Pistachios")
                    .description("Savory, Crunchy, Salty, Bold, Toasted, Fresh. Perfectly roasted pistachios with just the right amount of salt.")
                    .price(new BigDecimal("1199.00"))
                    .discountPrice(new BigDecimal("999.00"))
                    .imageUrl("https://images.unsplash.com/photo-1525171254930-643fc658b64e?w=600")
                    .category(pistachios)
                    .stock(60)
                    .weight("500")
                    .unit("gm")
                    .active(true)
                    .build());

            productRepo.save(Product.builder()
                    .name("Premium Mixed Dry Fruits")
                    .description("A perfect blend of cashews, almonds, pistachios, and raisins. Great for gifting and everyday snacking.")
                    .price(new BigDecimal("1299.00"))
                    .discountPrice(new BigDecimal("1099.00"))
                    .imageUrl("https://images.unsplash.com/photo-1596591868231-05e882e12e21?w=600")
                    .category(dryFruits)
                    .stock(50)
                    .weight("500")
                    .unit("gm")
                    .active(true)
                    .build());

            productRepo.save(Product.builder()
                    .name("Whole Cashews W240 Premium")
                    .description("The finest grade W240 whole cashews - larger, creamier, and more flavorful.")
                    .price(new BigDecimal("1099.00"))
                    .imageUrl("https://images.unsplash.com/photo-1599599810694-b5b37304c041?w=600")
                    .category(cashews)
                    .stock(40)
                    .weight("500")
                    .unit("gm")
                    .active(true)
                    .build());

            productRepo.save(Product.builder()
                    .name("Gift Box - Premium Collection")
                    .description("Elegant gift box containing our finest cashews, almonds, and pistachios. Perfect for festivals and celebrations.")
                    .price(new BigDecimal("2499.00"))
                    .discountPrice(new BigDecimal("2199.00"))
                    .imageUrl("https://images.unsplash.com/photo-1596591868231-05e882e12e21?w=600")
                    .category(dryFruits)
                    .stock(30)
                    .weight("1000")
                    .unit("gm")
                    .active(true)
                    .build());

            log.info("Sample data initialized successfully!");
        };
    }
}
