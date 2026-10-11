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
    static class Box<T> {
        private final T value;
        Box(T value) { this.value = value; }
        T get() { return value; }
    }
    static double total(List<? extends Number> values) {
        double sum = 0;
        for (Number value : values) sum += value.doubleValue();
        return sum;
    }

    public static void main(String[] args) throws Exception {
        Box<String> box = new Box<>("Java");
        System.out.println(box.get());
        System.out.println(total(List.of(2, 3)));
    }
}
