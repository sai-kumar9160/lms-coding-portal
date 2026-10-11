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
    static int sum(int... values) {
        int total = 0;
        for (int value : values) total += value;
        return total;
    }

    public static void main(String[] args) throws Exception {
        System.out.println(sum(2, 3, 4));
    }
}
