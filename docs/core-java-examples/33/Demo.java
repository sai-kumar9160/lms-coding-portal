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
        try {
            int divisor = 0;
            System.out.println(10 / divisor);
        } catch (ArithmeticException ex) {
            System.out.println("Cannot divide by zero");
        } finally {
            System.out.println("Finished attempt");
        }
    }
}
