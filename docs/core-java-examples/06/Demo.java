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
        int age = 20;
        long population = 8_000_000_000L;
        double price = 99.5;
        char grade = 'A';
        boolean active = true;
        System.out.println(age + " " + grade + " " + active);
    }
}
