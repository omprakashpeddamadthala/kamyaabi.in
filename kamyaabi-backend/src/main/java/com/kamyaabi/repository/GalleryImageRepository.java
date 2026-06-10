package com.kamyaabi.repository;

import com.kamyaabi.entity.GalleryImage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface GalleryImageRepository extends JpaRepository<GalleryImage, Long> {

    List<GalleryImage> findAllByOrderByDisplayOrderAscUploadedAtDesc();
}
