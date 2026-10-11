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
    static int sum(int a, int b) { return a + b; }

    public static void main(String[] args) throws Exception {
        int actual = sum(2, 3);
        if (actual != 5) throw new AssertionError("Expected 5, got " + actual);
        System.out.println("Check passed");
    }
}
