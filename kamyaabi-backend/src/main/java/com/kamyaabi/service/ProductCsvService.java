package com.kamyaabi.service;

import java.io.IOException;
import java.io.InputStream;
import java.io.Writer;
import java.util.Map;

public interface ProductCsvService {

    void writeProductsCsv(Writer writer) throws IOException;

    Map<String, Object> importProducts(InputStream inputStream) throws IOException;
}
