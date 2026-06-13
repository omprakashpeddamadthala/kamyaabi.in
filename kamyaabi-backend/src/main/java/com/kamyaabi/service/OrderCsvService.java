package com.kamyaabi.service;

import java.io.IOException;
import java.io.InputStream;
import java.io.Writer;
import java.util.Map;

public interface OrderCsvService {

    void writeOrdersCsv(Writer writer) throws IOException;

    Map<String, Object> importOrders(InputStream inputStream) throws IOException;
}
