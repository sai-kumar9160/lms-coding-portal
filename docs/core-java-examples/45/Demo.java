import java.io.*;
import java.nio.file.*;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.function.*;
import java.util.regex.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;
import java.time.*;
import java.time.format.DateTimeFormatter;
import java.sql.*;

public class Demo {
    public static void main(String[] args) throws Exception {
        Map<String, Integer> counts = new LinkedHashMap<>();
        for (String word : List.of("java", "sql", "java")) {
            counts.merge(word, 1, Integer::sum);
        }
        System.out.println(counts);
    }
}
