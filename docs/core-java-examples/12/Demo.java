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
        int day = 2;
        String label = switch (day) {
            case 1 -> "Monday";
            case 2 -> "Tuesday";
            default -> "Other day";
        };
        System.out.println(label);
    }
}
