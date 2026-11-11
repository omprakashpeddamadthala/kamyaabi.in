package com.kamyaabi.service;

import com.kamyaabi.dto.request.HeroBannerRequest;
import com.kamyaabi.dto.response.HeroBannerResponse;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface HeroBannerService {

    List<HeroBannerResponse> listActive();

    List<HeroBannerResponse> listAll();

    HeroBannerResponse create(HeroBannerRequest request, MultipartFile image);

    HeroBannerResponse update(Long id, HeroBannerRequest request, MultipartFile image);

    HeroBannerResponse setActive(Long id, boolean active);

    void delete(Long id);

    List<HeroBannerResponse> reorder(List<Long> orderedIds);
}
