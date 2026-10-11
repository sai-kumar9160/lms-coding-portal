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
        StringBuilder report = new StringBuilder("Names:");
        for (String name : List.of("Anil", "Sara")) {
            report.append(" ").append(name);
        }
        System.out.println(report.toString());
    }
}
